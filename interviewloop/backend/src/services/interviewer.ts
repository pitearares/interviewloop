import { anthropic, routeModel } from "./claude.js";

/**
 * Adaptive interviewer decision logic.
 *
 * Two layers, deliberately separated:
 *
 *  1. `applyGate` — a pure, deterministic function that decides whether the
 *     model should be consulted at all for a given tick. Cooldowns, activity
 *     heuristics, and the intervention budget live here, so most ticks cost
 *     nothing and the behavior can be unit-tested and explained line by line.
 *
 *  2. `decideIntervention` — one model call that, given the session snapshot,
 *     picks silent / ask_question / nudge / ask_explain and writes the message.
 *     The model can still choose "silent", so the gate only has to be roughly
 *     right about *when to look*, not about *what to say*.
 */

export type InterviewerAction = "silent" | "ask_question" | "nudge" | "ask_explain";

export interface InterviewerDecision {
  action: InterviewerAction;
  message: string | null;
}

export type EvaluationTrigger =
  | "pause" // candidate stopped typing (debounced)
  | "periodic" // regular check-in tick
  | "stuck"; // long inactivity with little code progress

export interface TranscriptTurn {
  role: "interviewer" | "candidate";
  text: string;
}

/** Everything the decision layer is allowed to see about a session. */
export interface SessionSnapshot {
  problemTitle: string;
  problemPrompt: string;
  problemConstraints: string;
  language: string;
  currentCode: string;
  /** Code as of the previous consulted evaluation, for diff context. */
  previousCode: string | null;
  elapsedSec: number;
  secondsSinceLastCodeChange: number;
  secondsSinceLastInterviewerMessage: number | null;
  secondsSinceLastCandidateMessage: number | null;
  interventionCount: number;
  recentTranscript: TranscriptTurn[];
  trigger: EvaluationTrigger;
}

export interface GateResult {
  consult: boolean;
  reason: string;
}

// ---------------------------------------------------------------------------
// Layer 1 — deterministic gate
// ---------------------------------------------------------------------------

/** Minimum quiet time between interviewer interventions. */
const MIN_GAP_AFTER_INTERVIEWER_SEC = 60;
/** Don't talk over a candidate who just said something (that path is handled separately). */
const MIN_GAP_AFTER_CANDIDATE_SEC = 15;
/** Soft cap on unprompted interventions per session; "stuck" may exceed it. */
const MAX_UNPROMPTED_INTERVENTIONS = 6;
/** Grace period at the start before the interviewer weighs in on code. */
const WARMUP_SEC = 60;
/** With an empty editor, only speak up after this much silence. */
const BLANK_EDITOR_STUCK_SEC = 120;

export function applyGate(s: SessionSnapshot): GateResult {
  if (s.elapsedSec < WARMUP_SEC) {
    return { consult: false, reason: `warmup (${s.elapsedSec}s < ${WARMUP_SEC}s)` };
  }

  if (
    s.secondsSinceLastInterviewerMessage !== null &&
    s.secondsSinceLastInterviewerMessage < MIN_GAP_AFTER_INTERVIEWER_SEC
  ) {
    return { consult: false, reason: "cooldown: interviewer spoke recently" };
  }

  if (
    s.secondsSinceLastCandidateMessage !== null &&
    s.secondsSinceLastCandidateMessage < MIN_GAP_AFTER_CANDIDATE_SEC
  ) {
    return { consult: false, reason: "cooldown: candidate just messaged" };
  }

  if (s.trigger !== "stuck" && s.interventionCount >= MAX_UNPROMPTED_INTERVENTIONS) {
    return { consult: false, reason: "intervention budget spent" };
  }

  if (!s.currentCode.trim()) {
    // Blank editor: don't pepper them while they think, but do check in
    // if they've been silent for a long time.
    if (s.secondsSinceLastCodeChange >= BLANK_EDITOR_STUCK_SEC) {
      return { consult: true, reason: "blank editor for a long time" };
    }
    return { consult: false, reason: "blank editor, still thinking" };
  }

  if (s.trigger === "periodic" && s.previousCode !== null && s.previousCode === s.currentCode) {
    // Periodic tick with no code movement since we last looked. Either they're
    // thinking (fine) or stuck — the dedicated "stuck" trigger covers the
    // latter, so skip here to avoid double-firing.
    return { consult: false, reason: "periodic tick, code unchanged since last look" };
  }

  return { consult: true, reason: `trigger '${s.trigger}' passed all gates` };
}

// ---------------------------------------------------------------------------
// Layer 2 — model calls
// ---------------------------------------------------------------------------

const INTERVIEWER_PERSONA = `You are a friendly but rigorous technical interviewer conducting a live coding interview. You watch the candidate's code evolve in real time and occasionally speak up, exactly like a good human interviewer:

- You never give away the solution. Nudges point at *where* to look, not *what* to write.
- You care as much about communication as correctness: candidates who narrate their thinking should be left alone; silent candidates should occasionally be asked to explain their approach.
- You are brief. One or two sentences. This appears in a small side panel while they code.
- You never comment on trivial things (formatting, variable names in progress, half-typed lines).
- Staying silent is often the best move — a candidate making steady progress should not be interrupted.`;

/**
 * Builds the cached system prompt: persona + decision rubric + the problem.
 * These are static per session, so the whole block carries a cache_control
 * breakpoint and is only paid for once per cache window.
 */
function buildSystemBlocks(s: SessionSnapshot) {
  return [
    {
      type: "text" as const,
      text: `${INTERVIEWER_PERSONA}

## Decision rubric

When shown the session state, choose exactly one action:
- "silent" — the candidate is progressing, thinking, or was recently spoken to. Default to this when unsure.
- "ask_question" — a targeted question about their approach, an edge case, or complexity. Use when the code reveals a misunderstanding or a discussion-worthy choice.
- "nudge" — a small hint for a candidate who is stuck or heading down a dead end. Use sparingly, only when they've been stalled for a while.
- "ask_explain" — ask the candidate to talk through their approach out loud. Use when they've been coding silently and their direction isn't clear.

## Problem the candidate is solving

### ${s.problemTitle}

${s.problemPrompt}

Constraints:
${s.problemConstraints}`,
      cache_control: { type: "ephemeral" as const },
    },
  ];
}

function formatTranscript(turns: TranscriptTurn[]): string {
  if (turns.length === 0) return "(no conversation yet)";
  return turns.map((t) => `${t.role === "interviewer" ? "You" : "Candidate"}: ${t.text}`).join("\n");
}

function buildStateMessage(s: SessionSnapshot): string {
  return `## Session state

- Trigger for this check: ${s.trigger}
- Elapsed time: ${Math.round(s.elapsedSec / 60)}m ${s.elapsedSec % 60}s
- Seconds since last code change: ${s.secondsSinceLastCodeChange}
- Your unprompted interventions so far: ${s.interventionCount}
- Language: ${s.language}

## Recent conversation
${formatTranscript(s.recentTranscript)}

## Candidate's current code
\`\`\`${s.language}
${s.currentCode || "(editor is empty)"}
\`\`\`
${
  s.previousCode !== null && s.previousCode !== s.currentCode
    ? `\n## Code as of your previous look\n\`\`\`${s.language}\n${s.previousCode}\n\`\`\`\n`
    : ""
}
Decide your action now.`;
}

const DECISION_SCHEMA = {
  type: "object" as const,
  properties: {
    action: {
      type: "string" as const,
      enum: ["silent", "ask_question", "nudge", "ask_explain"],
      description: "What the interviewer should do right now.",
    },
    message: {
      anyOf: [{ type: "string" as const }, { type: "null" as const }],
      description:
        "The message to show the candidate, 1-2 sentences. Must be null when action is 'silent'.",
    },
  },
  required: ["action", "message"],
  additionalProperties: false,
};

/**
 * The model-side half of the decision loop. Only called when `applyGate`
 * said the tick is worth a look; the model may still answer "silent".
 */
export async function decideIntervention(s: SessionSnapshot): Promise<InterviewerDecision> {
  const response = await anthropic.messages.create({
    model: routeModel("interview"),
    max_tokens: 300,
    output_config: {
      effort: "low", // latency-sensitive; the rubric does the heavy lifting
      format: { type: "json_schema", schema: DECISION_SCHEMA },
    },
    system: buildSystemBlocks(s),
    messages: [{ role: "user", content: buildStateMessage(s) }],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  try {
    const parsed = JSON.parse(text) as InterviewerDecision;
    if (parsed.action === "silent") return { action: "silent", message: null };
    if (!parsed.message) return { action: "silent", message: null };
    return parsed;
  } catch {
    // A malformed decision should never interrupt the candidate.
    return { action: "silent", message: null };
  }
}

/**
 * Direct reply when the candidate types something to the interviewer.
 * No gate here — a question always deserves an answer.
 */
export async function respondToCandidate(
  s: SessionSnapshot,
  candidateMessage: string,
): Promise<string> {
  const response = await anthropic.messages.create({
    model: routeModel("interview"),
    max_tokens: 400,
    output_config: { effort: "low" },
    system: buildSystemBlocks(s),
    messages: [
      {
        role: "user",
        content: `${buildStateMessage(s)}

The candidate just said to you:
"${candidateMessage}"

Reply to them directly, in character, in 1-3 sentences. Answer clarifying questions about the problem honestly; deflect requests for the solution with a gentle nudge instead.`,
      },
    ],
  });

  return response.content.find((b) => b.type === "text")?.text?.trim() ?? "";
}

/** Opening greeting when a session starts. Static fallback keeps startup instant if the API hiccups. */
export async function openingMessage(problemTitle: string): Promise<string> {
  const fallback = `Hi! I'm your interviewer today. We'll be working on "${problemTitle}". Take a moment to read the problem, feel free to ask clarifying questions, and talk me through your approach whenever you're ready.`;
  try {
    const response = await anthropic.messages.create({
      model: routeModel("interview"),
      max_tokens: 200,
      output_config: { effort: "low" },
      system: INTERVIEWER_PERSONA,
      messages: [
        {
          role: "user",
          content: `The interview is starting. The problem is "${problemTitle}". Greet the candidate in 1-2 warm, professional sentences and invite them to read the problem and ask clarifying questions. Do not restate the problem.`,
        },
      ],
    });
    return response.content.find((b) => b.type === "text")?.text?.trim() || fallback;
  } catch {
    return fallback;
  }
}
