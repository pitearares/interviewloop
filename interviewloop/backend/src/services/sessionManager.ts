import type { Server as SocketIOServer } from "socket.io";
import { prisma } from "../db/prisma.js";
import {
  applyGate,
  decideIntervention,
  openingMessage,
  respondToCandidate,
  type EvaluationTrigger,
  type SessionSnapshot,
  type TranscriptTurn,
} from "./interviewer.js";

/**
 * Runtime state for live interview sessions.
 *
 * Timing model (all values are deliberately coarse — this is about feeling
 * human, not precision):
 *   - "pause" evaluation fires 30s after the last keystroke (debounced), so
 *     we look at code at natural stopping points, never mid-typing.
 *   - "stuck" evaluation fires after 75s with no keystroke at all.
 *   - a periodic tick every 90s catches slow-and-steady sessions.
 * All three funnel through the same gate in interviewer.ts, which enforces
 * cooldowns and the intervention budget.
 */

const PAUSE_DEBOUNCE_MS = 30_000;
const STUCK_AFTER_MS = 75_000;
const PERIODIC_TICK_MS = 90_000;
/** How much conversation context the model sees. */
const TRANSCRIPT_WINDOW = 12;
/** Persist a code snapshot at most this often, so the DB isn't a keylogger. */
const SNAPSHOT_MIN_INTERVAL_MS = 20_000;

interface LiveSession {
  sessionId: string;
  problem: {
    title: string;
    prompt: string;
    constraints: string;
  };
  language: string;
  startedAt: number;
  currentCode: string;
  /** Code as of the last time the model was consulted. */
  lastConsultedCode: string | null;
  lastCodeChangeAt: number;
  lastSnapshotPersistedAt: number;
  lastInterviewerMessageAt: number | null;
  lastCandidateMessageAt: number | null;
  interventionCount: number;
  transcript: TranscriptTurn[];
  /**
   * Every model-invoking operation (evaluate, candidate reply) is appended
   * to this promise chain instead of guarded by a boolean flag. That way a
   * candidate message that arrives mid-evaluation is queued and *always*
   * answered, rather than silently dropped because a flag was set.
   */
  queue: Promise<void>;
  pauseTimer: NodeJS.Timeout | null;
  stuckTimer: NodeJS.Timeout | null;
  periodicTimer: NodeJS.Timeout | null;
}

const live = new Map<string, LiveSession>();
/**
 * SessionIds currently in the async gap between "decided to start" and
 * "registered in `live`". Claimed synchronously (before any `await`) so two
 * rapid session:join events for the same session can't both pass the
 * `live.has` check and create two competing LiveSessions (double greeting,
 * double timers).
 */
const starting = new Set<string>();

function nowSec(ms: number): number {
  return Math.round(ms / 1000);
}

function snapshotOf(s: LiveSession, trigger: EvaluationTrigger): SessionSnapshot {
  const now = Date.now();
  return {
    problemTitle: s.problem.title,
    problemPrompt: s.problem.prompt,
    problemConstraints: s.problem.constraints,
    language: s.language,
    currentCode: s.currentCode,
    previousCode: s.lastConsultedCode,
    elapsedSec: nowSec(now - s.startedAt),
    secondsSinceLastCodeChange: nowSec(now - s.lastCodeChangeAt),
    secondsSinceLastInterviewerMessage:
      s.lastInterviewerMessageAt === null ? null : nowSec(now - s.lastInterviewerMessageAt),
    secondsSinceLastCandidateMessage:
      s.lastCandidateMessageAt === null ? null : nowSec(now - s.lastCandidateMessageAt),
    interventionCount: s.interventionCount,
    recentTranscript: s.transcript.slice(-TRANSCRIPT_WINDOW),
    trigger,
  };
}

async function persistEntry(sessionId: string, type: string, content: string) {
  try {
    await prisma.transcriptEntry.create({ data: { sessionId, type, content } });
  } catch (err) {
    console.error(`[session ${sessionId}] failed to persist ${type}:`, err);
  }
}

async function emitInterviewerMessage(
  io: SocketIOServer,
  s: LiveSession,
  kind: "INTERVIEWER_QUESTION" | "INTERVIEWER_NUDGE",
  text: string,
) {
  s.transcript.push({ role: "interviewer", text });
  s.lastInterviewerMessageAt = Date.now();
  io.to(s.sessionId).emit("interviewer:message", { kind, text, at: new Date().toISOString() });
  await persistEntry(s.sessionId, kind, text);
}

/**
 * Appends `work` to the session's queue so it runs after anything already
 * queued, never concurrently with it. Errors are caught here so one failed
 * item can't break the chain for everything queued after it.
 */
function enqueue(s: LiveSession, work: () => Promise<void>): void {
  s.queue = s.queue.then(work).catch((err) => {
    console.error(`[session ${s.sessionId}] queued work failed:`, err);
  });
}

/**
 * The evaluation entry point every timer funnels into. The snapshot is
 * built when this *runs* (not when it's queued), so a call sitting behind
 * an in-flight reply still evaluates against fresh state. Gate first
 * (free), model second (only when the gate passes).
 */
function evaluate(io: SocketIOServer, s: LiveSession, trigger: EvaluationTrigger): void {
  enqueue(s, async () => {
    const snapshot = snapshotOf(s, trigger);
    const gate = applyGate(snapshot);
    console.log(
      `[session ${s.sessionId}] tick '${trigger}' → ${gate.consult ? "CONSULT" : "skip"} (${gate.reason})`,
    );
    if (!gate.consult) return;

    io.to(s.sessionId).emit("interviewer:thinking", true);
    try {
      const decision = await decideIntervention(snapshot);
      s.lastConsultedCode = s.currentCode;
      console.log(`[session ${s.sessionId}] model decision: ${decision.action}`);

      if (decision.action !== "silent" && decision.message) {
        s.interventionCount += 1;
        const kind = decision.action === "nudge" ? "INTERVIEWER_NUDGE" : "INTERVIEWER_QUESTION";
        await emitInterviewerMessage(io, s, kind, decision.message);
      }
    } finally {
      io.to(s.sessionId).emit("interviewer:thinking", false);
    }
  });
}

function armCodeTimers(io: SocketIOServer, s: LiveSession) {
  if (s.pauseTimer) clearTimeout(s.pauseTimer);
  if (s.stuckTimer) clearTimeout(s.stuckTimer);
  s.pauseTimer = setTimeout(() => evaluate(io, s, "pause"), PAUSE_DEBOUNCE_MS);
  s.stuckTimer = setTimeout(() => evaluate(io, s, "stuck"), STUCK_AFTER_MS);
}

export const sessionManager = {
  /** Begin a live session: load problem, greet the candidate, arm timers. */
  async start(io: SocketIOServer, sessionId: string): Promise<void> {
    if (live.has(sessionId) || starting.has(sessionId)) return; // already live or being started
    starting.add(sessionId);

    try {
      const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: { problem: true },
      });
      if (!session || session.status !== "IN_PROGRESS") return;
      // Re-check after the await in case a concurrent call raced us here.
      if (live.has(sessionId)) return;

      const s: LiveSession = {
        sessionId,
        problem: {
          title: session.problem.title,
          prompt: session.problem.prompt,
          constraints: session.problem.constraints,
        },
        language: session.language,
        startedAt: Date.now(),
        currentCode: "",
        lastConsultedCode: null,
        lastCodeChangeAt: Date.now(),
        lastSnapshotPersistedAt: 0,
        lastInterviewerMessageAt: null,
        lastCandidateMessageAt: null,
        interventionCount: 0,
        transcript: [],
        queue: Promise.resolve(),
        pauseTimer: null,
        stuckTimer: null,
        periodicTimer: null,
      };
      live.set(sessionId, s);

      s.periodicTimer = setInterval(() => evaluate(io, s, "periodic"), PERIODIC_TICK_MS);
      armCodeTimers(io, s);

      enqueue(s, async () => {
        const greeting = await openingMessage(s.problem.title);
        await emitInterviewerMessage(io, s, "INTERVIEWER_QUESTION", greeting);
        // The greeting shouldn't count against the unprompted-intervention budget.
        s.interventionCount = 0;
        s.lastInterviewerMessageAt = null;
      });
    } finally {
      starting.delete(sessionId);
    }
  },

  /** Candidate typed in the editor. */
  onCodeUpdate(io: SocketIOServer, sessionId: string, code: string): void {
    const s = live.get(sessionId);
    if (!s) return;
    s.currentCode = code;
    s.lastCodeChangeAt = Date.now();
    armCodeTimers(io, s);

    const now = Date.now();
    if (now - s.lastSnapshotPersistedAt >= SNAPSHOT_MIN_INTERVAL_MS) {
      s.lastSnapshotPersistedAt = now;
      void persistEntry(sessionId, "CODE_SNAPSHOT", code);
    }
  },

  /**
   * Candidate sent a chat message to the interviewer. Bookkeeping (transcript
   * + persistence) happens immediately; the reply is queued so it always
   * fires, even if an evaluation is already in flight.
   */
  onCandidateMessage(io: SocketIOServer, sessionId: string, text: string): void {
    const s = live.get(sessionId);
    if (!s) return;

    s.transcript.push({ role: "candidate", text });
    s.lastCandidateMessageAt = Date.now();
    void persistEntry(sessionId, "CANDIDATE_ANSWER", text);

    enqueue(s, async () => {
      io.to(sessionId).emit("interviewer:thinking", true);
      try {
        const reply = await respondToCandidate(snapshotOf(s, "periodic"), text);
        if (reply) {
          await emitInterviewerMessage(io, s, "INTERVIEWER_QUESTION", reply);
        }
      } finally {
        io.to(sessionId).emit("interviewer:thinking", false);
      }
    });
  },

  /**
   * End the session: stop timers, persist final code + duration. Waits for
   * anything already queued (e.g. a reply mid-flight) so the transcript is
   * complete before the caller (e.g. evaluation generation) reads it.
   */
  async end(sessionId: string): Promise<void> {
    const s = live.get(sessionId);
    if (!s) return;
    if (s.pauseTimer) clearTimeout(s.pauseTimer);
    if (s.stuckTimer) clearTimeout(s.stuckTimer);
    if (s.periodicTimer) clearInterval(s.periodicTimer);
    live.delete(sessionId);

    await s.queue.catch(() => {});

    if (s.currentCode.trim()) {
      await persistEntry(sessionId, "CODE_SNAPSHOT", s.currentCode);
    }
    const durationSec = nowSec(Date.now() - s.startedAt);
    try {
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED", endedAt: new Date(), durationSec },
      });
    } catch (err) {
      console.error(`[session ${sessionId}] failed to finalize:`, err);
    }
  },

  /** For tests/inspection. */
  isLive(sessionId: string): boolean {
    return live.has(sessionId);
  },
};
