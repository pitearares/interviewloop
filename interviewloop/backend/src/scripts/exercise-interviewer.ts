import "dotenv/config";
import {
  applyGate,
  decideIntervention,
  type SessionSnapshot,
} from "../services/interviewer.js";

/**
 * Exercises the adaptive interviewer decision loop end-to-end against a
 * hardcoded problem (Two Sum), without the frontend or sockets.
 *
 *   npm run exercise
 *
 * Part 1 always runs: it replays a scripted interview timeline through the
 * deterministic gate and prints every decision, so the gating behavior can
 * be inspected without spending a single token.
 *
 * Part 2 runs only when ANTHROPIC_API_KEY is set: it sends two contrasting
 * snapshots (steady progress vs. clearly stuck) to the model and prints the
 * decisions, verifying the full loop including JSON decision parsing.
 */

const PROBLEM = {
  title: "Two Sum",
  prompt:
    "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`. Each input has exactly one solution; you may not use the same element twice.",
  constraints: "- 2 <= nums.length <= 10^4\n- exactly one valid answer exists",
};

function snap(overrides: Partial<SessionSnapshot>): SessionSnapshot {
  return {
    problemTitle: PROBLEM.title,
    problemPrompt: PROBLEM.prompt,
    problemConstraints: PROBLEM.constraints,
    language: "javascript",
    currentCode: "",
    previousCode: null,
    elapsedSec: 0,
    secondsSinceLastCodeChange: 0,
    secondsSinceLastInterviewerMessage: null,
    secondsSinceLastCandidateMessage: null,
    interventionCount: 0,
    recentTranscript: [],
    trigger: "periodic",
    ...overrides,
  };
}

const BRUTE_FORCE = `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
}`;

const STUCK_FRAGMENT = `function twoSum(nums, target) {
  // hmm
  const seen = {};
}`;

// ---------------------------------------------------------------------------
// Part 1 — gate replay (deterministic, free)
// ---------------------------------------------------------------------------

const timeline: { label: string; s: SessionSnapshot }[] = [
  {
    label: "0:30 — warmup, periodic tick",
    s: snap({ elapsedSec: 30, trigger: "periodic" }),
  },
  {
    label: "2:00 — blank editor, still thinking (stuck tick)",
    s: snap({ elapsedSec: 120, secondsSinceLastCodeChange: 75, trigger: "stuck" }),
  },
  {
    label: "3:00 — blank editor for 2+ minutes (stuck tick)",
    s: snap({ elapsedSec: 180, secondsSinceLastCodeChange: 150, trigger: "stuck" }),
  },
  {
    label: "5:00 — brute force written, pause after typing",
    s: snap({
      elapsedSec: 300,
      currentCode: BRUTE_FORCE,
      secondsSinceLastCodeChange: 30,
      trigger: "pause",
    }),
  },
  {
    label: "5:40 — periodic tick right after interviewer spoke",
    s: snap({
      elapsedSec: 340,
      currentCode: BRUTE_FORCE,
      previousCode: BRUTE_FORCE,
      secondsSinceLastCodeChange: 70,
      secondsSinceLastInterviewerMessage: 40,
      interventionCount: 1,
      trigger: "periodic",
    }),
  },
  {
    label: "8:00 — periodic tick, code unchanged since last look",
    s: snap({
      elapsedSec: 480,
      currentCode: BRUTE_FORCE,
      previousCode: BRUTE_FORCE,
      secondsSinceLastCodeChange: 200,
      secondsSinceLastInterviewerMessage: 180,
      interventionCount: 1,
      trigger: "periodic",
    }),
  },
  {
    label: "9:00 — stuck: no keystroke for 75s on a half-finished idea",
    s: snap({
      elapsedSec: 540,
      currentCode: STUCK_FRAGMENT,
      previousCode: BRUTE_FORCE,
      secondsSinceLastCodeChange: 80,
      secondsSinceLastInterviewerMessage: 240,
      interventionCount: 1,
      trigger: "stuck",
    }),
  },
  {
    label: "12:00 — budget spent, pause tick",
    s: snap({
      elapsedSec: 720,
      currentCode: STUCK_FRAGMENT,
      secondsSinceLastCodeChange: 35,
      secondsSinceLastInterviewerMessage: 120,
      interventionCount: 6,
      trigger: "pause",
    }),
  },
];

console.log("=== Part 1: deterministic gate replay ===\n");
for (const { label, s } of timeline) {
  const gate = applyGate(s);
  console.log(`${gate.consult ? "CONSULT" : "  skip "}  ${label}`);
  console.log(`          reason: ${gate.reason}\n`);
}

// ---------------------------------------------------------------------------
// Part 2 — live model decisions (needs ANTHROPIC_API_KEY)
// ---------------------------------------------------------------------------

if (!process.env.ANTHROPIC_API_KEY) {
  console.log("=== Part 2 skipped: set ANTHROPIC_API_KEY to exercise live model decisions ===");
} else {
  console.log("=== Part 2: live model decisions ===\n");

  const cases: { label: string; s: SessionSnapshot }[] = [
    {
      label: "Steady progress on a working brute force (expect silent or a complexity question)",
      s: snap({
        elapsedSec: 300,
        currentCode: BRUTE_FORCE,
        secondsSinceLastCodeChange: 30,
        trigger: "pause",
        recentTranscript: [
          { role: "interviewer", text: "Hi! Ready when you are — feel free to think out loud." },
          { role: "candidate", text: "I'll start with brute force and optimize after." },
        ],
      }),
    },
    {
      label: "Visibly stuck for a long time (expect a nudge or ask_explain)",
      s: snap({
        elapsedSec: 540,
        currentCode: STUCK_FRAGMENT,
        previousCode: STUCK_FRAGMENT,
        secondsSinceLastCodeChange: 120,
        secondsSinceLastInterviewerMessage: 300,
        interventionCount: 1,
        trigger: "stuck",
        recentTranscript: [
          { role: "interviewer", text: "Hi! Ready when you are — feel free to think out loud." },
        ],
      }),
    },
  ];

  for (const { label, s } of cases) {
    console.log(`--- ${label}`);
    const decision = await decideIntervention(s);
    console.log(`    action:  ${decision.action}`);
    console.log(`    message: ${decision.message ?? "(none)"}\n`);
  }
}
