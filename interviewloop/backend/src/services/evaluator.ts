import { anthropic, routeModel } from "./claude.js";
import { prisma } from "../db/prisma.js";
import { runCode, type RunTestCase } from "./codeRunner.js";

/**
 * End-of-interview evaluation: synthesizes the full transcript (code
 * evolution, Q&A, timing) plus an actual test run of the final code into
 * a structured report, persisted once per session.
 */

export type Verdict = "STRONG_HIRE" | "HIRE" | "LEANING_NO" | "NO";

export interface EvaluationResult {
  verdict: Verdict;
  correctness: string;
  communication: string;
  codeQuality: string;
  advice: string[];
}

const REPORT_SCHEMA = {
  type: "object" as const,
  properties: {
    verdict: {
      type: "string" as const,
      enum: ["STRONG_HIRE", "HIRE", "LEANING_NO", "NO"],
      description:
        "Overall practice verdict, framed as feedback on this practice session rather than a real hiring decision.",
    },
    correctness: {
      type: "string" as const,
      description:
        "Assessment of solution correctness: does the final code solve the problem, handle edge cases, and what is its complexity? 2-5 sentences of markdown.",
    },
    communication: {
      type: "string" as const,
      description:
        "Assessment of communication: did the candidate explain their thinking, ask clarifying questions, respond to interviewer prompts? 2-5 sentences of markdown.",
    },
    codeQuality: {
      type: "string" as const,
      description:
        "Notes on code quality: naming, structure, idiomatic use of the language. 2-4 sentences of markdown.",
    },
    advice: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Exactly 2-3 concrete, actionable pieces of advice for the next practice session.",
    },
  },
  required: ["verdict", "correctness", "communication", "codeQuality", "advice"],
  additionalProperties: false,
};

const EVALUATOR_SYSTEM = `You are a senior engineer writing the debrief for a practice technical interview. You watched the whole session: the problem, the code as it evolved, the conversation, and the timing. Write honest, specific, encouraging feedback.

Ground rules:
- This is practice, so frame the verdict as practice feedback ("in a real interview this would likely read as...") rather than a judgment of the person.
- Quote or reference concrete moments from the transcript and code when making a point — generic feedback is useless.
- Correctness weighs the final code and the test-run results. Communication weighs how they explained themselves and engaged with your questions. A silent candidate with perfect code should hear that; a communicative candidate with a near-miss should hear that too.
- Advice items must be concrete actions ("practice narrating your approach before typing", not "communicate better").`;

interface TranscriptRow {
  type: string;
  content: string;
  createdAt: Date;
}

/**
 * Compacts the transcript for the model: keeps every conversational turn,
 * but thins code snapshots to first / a few middles / last so a long
 * session doesn't blow up the prompt.
 */
function compactTranscript(entries: TranscriptRow[], startedAt: Date): string {
  const MAX_CODE_SNAPSHOTS = 5;
  const codeIdx = entries
    .map((e, i) => (e.type === "CODE_SNAPSHOT" ? i : -1))
    .filter((i) => i >= 0);

  const keepCode = new Set<number>();
  if (codeIdx.length <= MAX_CODE_SNAPSHOTS) {
    codeIdx.forEach((i) => keepCode.add(i));
  } else {
    keepCode.add(codeIdx[0]);
    keepCode.add(codeIdx[codeIdx.length - 1]);
    const step = (codeIdx.length - 1) / (MAX_CODE_SNAPSHOTS - 1);
    for (let k = 1; k < MAX_CODE_SNAPSHOTS - 1; k++) {
      keepCode.add(codeIdx[Math.round(k * step)]);
    }
  }

  const lines: string[] = [];
  entries.forEach((e, i) => {
    const t = Math.round((e.createdAt.getTime() - startedAt.getTime()) / 1000);
    const stamp = `[${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}]`;
    switch (e.type) {
      case "CODE_SNAPSHOT":
        if (keepCode.has(i)) {
          lines.push(`${stamp} CODE SNAPSHOT:\n\`\`\`\n${e.content}\n\`\`\``);
        }
        break;
      case "INTERVIEWER_QUESTION":
        lines.push(`${stamp} Interviewer: ${e.content}`);
        break;
      case "INTERVIEWER_NUDGE":
        lines.push(`${stamp} Interviewer (nudge): ${e.content}`);
        break;
      case "CANDIDATE_ANSWER":
        lines.push(`${stamp} Candidate: ${e.content}`);
        break;
      default:
        lines.push(`${stamp} ${e.type}: ${e.content}`);
    }
  });
  return lines.join("\n\n") || "(empty transcript)";
}

async function summarizeFinalRun(
  language: string,
  finalCode: string | null,
  testCasesJson: string,
): Promise<string> {
  if (!finalCode?.trim()) return "No code was submitted.";
  try {
    const testCases = JSON.parse(testCasesJson) as RunTestCase[];
    const run = await runCode(language, finalCode, testCases);
    if (run.runtimeError) return `Final code failed to run: ${run.runtimeError}`;
    const passed = run.results.filter((r) => r.passed).length;
    const failures = run.results
      .filter((r) => !r.passed)
      .map(
        (r) =>
          `input=${JSON.stringify(r.input)} expected=${JSON.stringify(r.expected)} got=${
            r.error ?? JSON.stringify(r.actual)
          }`,
      );
    return (
      `${passed}/${run.results.length} example test cases passed.` +
      (failures.length ? `\nFailures:\n- ${failures.join("\n- ")}` : "")
    );
  } catch (err) {
    return `Test run could not be completed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/**
 * Generates and persists the evaluation report for a session.
 * Idempotent: returns the existing report if one was already generated.
 */
export async function evaluateSession(sessionId: string): Promise<EvaluationResult> {
  const existing = await prisma.evaluationReport.findUnique({ where: { sessionId } });
  if (existing) {
    return {
      verdict: existing.verdict as Verdict,
      correctness: existing.correctness,
      communication: existing.communication,
      codeQuality: existing.codeQuality,
      advice: JSON.parse(existing.advice) as string[],
    };
  }

  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: {
      problem: true,
      transcriptEntries: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!session) throw new Error("Session not found");

  const lastSnapshot = [...session.transcriptEntries]
    .reverse()
    .find((e) => e.type === "CODE_SNAPSHOT");
  const finalCode = lastSnapshot?.content ?? null;

  const runSummary = await summarizeFinalRun(
    session.language,
    finalCode,
    session.problem.testCases,
  );

  const durationSec =
    session.durationSec ??
    Math.round(
      ((session.endedAt ?? new Date()).getTime() - session.startedAt.getTime()) / 1000,
    );

  const userMessage = `## Problem

### ${session.problem.title} (${session.problem.difficulty})

${session.problem.prompt}

Constraints:
${session.problem.constraints}

## Session facts

- Language: ${session.language}
- Duration: ${Math.floor(durationSec / 60)}m ${durationSec % 60}s
- Result of running the final code against the example test cases: ${runSummary}

## Full transcript (timestamped)

${compactTranscript(session.transcriptEntries, session.startedAt)}

Write the evaluation report now.`;

  const response = await anthropic.messages.create({
    model: routeModel("evaluation"),
    max_tokens: 1500,
    output_config: {
      format: { type: "json_schema", schema: REPORT_SCHEMA },
    },
    system: EVALUATOR_SYSTEM,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  const report = JSON.parse(text) as EvaluationResult;

  await prisma.$transaction([
    prisma.evaluationReport.create({
      data: {
        sessionId,
        verdict: report.verdict,
        correctness: report.correctness,
        communication: report.communication,
        codeQuality: report.codeQuality,
        advice: JSON.stringify(report.advice),
      },
    }),
    prisma.interviewSession.update({
      where: { id: sessionId },
      data:
        session.status === "IN_PROGRESS"
          ? { status: "COMPLETED", endedAt: new Date(), durationSec }
          : {},
    }),
  ]);

  return report;
}
