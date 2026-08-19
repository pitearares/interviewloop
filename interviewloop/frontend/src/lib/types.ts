export type Difficulty = "EASY" | "MEDIUM";
export type Topic = "ARRAYS_STRINGS" | "ALGORITHMS" | "DATA_STRUCTURES" | "DYNAMIC_PROGRAMMING";
export type SessionStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
export type Verdict = "STRONG_HIRE" | "HIRE" | "LEANING_NO" | "NO";

export interface ProblemSummary {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topic: Topic;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemDetail extends ProblemSummary {
  prompt: string;
  constraints: string;
  examples: ProblemExample[];
  starterCodeJs: string;
  starterCodePy: string;
}

export interface TranscriptEntry {
  id: string;
  type:
    | "CODE_SNAPSHOT"
    | "INTERVIEWER_QUESTION"
    | "INTERVIEWER_NUDGE"
    | "CANDIDATE_ANSWER"
    | "SYSTEM_NOTE";
  content: string;
  createdAt: string;
}

export interface EvaluationReport {
  verdict: Verdict;
  correctness: string;
  communication: string;
  codeQuality: string;
  advice: string[];
}

export interface InterviewSessionSummary {
  id: string;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  problem: { title: string; slug: string; difficulty: Difficulty };
  evaluationReport: { verdict: Verdict } | null;
}

export interface InterviewSessionDetail {
  id: string;
  status: SessionStatus;
  language: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  problem: ProblemDetail;
  transcriptEntries: TranscriptEntry[];
  evaluationReport: EvaluationReport | null;
}

/** A chat-panel message shown in the InterviewerPanel — either side. */
export interface ChatMessage {
  id: string;
  role: "interviewer" | "candidate";
  kind?: TranscriptEntry["type"];
  text: string;
  at: string;
}

export interface TestCaseResult {
  input: unknown[];
  expected: unknown;
  actual: unknown;
  passed: boolean;
  error: string | null;
}

export interface RunResult {
  results: TestCaseResult[];
  allPassed: boolean;
  runtimeError: string | null;
}
