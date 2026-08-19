import type {
  ProblemDetail,
  ProblemSummary,
  InterviewSessionSummary,
  InterviewSessionDetail,
  RunResult,
} from "./types";

const BASE_URL = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request to ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Raw shape from the backend, where JSON-blob columns arrive as strings. */
interface RawProblemDetail extends Omit<ProblemDetail, "examples"> {
  examples: string;
}

function parseProblemDetail(raw: RawProblemDetail): ProblemDetail {
  return { ...raw, examples: JSON.parse(raw.examples) };
}

export const api = {
  getProblems: () => request<ProblemSummary[]>("/problems"),
  getProblem: async (slug: string) => parseProblemDetail(await request<RawProblemDetail>(`/problems/${slug}`)),

  createSession: (problemId: string, language: string) =>
    request<{ id: string }>("/sessions", {
      method: "POST",
      body: JSON.stringify({ problemId, language }),
    }),
  getSessions: () => request<InterviewSessionSummary[]>("/sessions"),
  getSession: async (id: string) => {
    const raw = await request<Omit<InterviewSessionDetail, "problem" | "evaluationReport"> & {
      problem: RawProblemDetail;
      evaluationReport: (Omit<NonNullable<InterviewSessionDetail["evaluationReport"]>, "advice"> & {
        advice: string;
      }) | null;
    }>(`/sessions/${id}`);
    return {
      ...raw,
      problem: parseProblemDetail(raw.problem),
      evaluationReport: raw.evaluationReport
        ? { ...raw.evaluationReport, advice: JSON.parse(raw.evaluationReport.advice) }
        : null,
    } satisfies InterviewSessionDetail;
  },

  evaluateSession: (id: string) =>
    request<import("./types").EvaluationReport>(`/sessions/${id}/evaluate`, { method: "POST" }),

  runCode: (problemId: string, language: string, code: string) =>
    request<RunResult>("/run", {
      method: "POST",
      body: JSON.stringify({ problemId, language, code }),
    }),
};
