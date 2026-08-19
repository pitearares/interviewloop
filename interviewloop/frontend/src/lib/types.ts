export type Difficulty = "EASY" | "MEDIUM";
export type Topic =
  | "ARRAYS_STRINGS"
  | "ALGORITHMS"
  | "DATA_STRUCTURES"
  | "DYNAMIC_PROGRAMMING"
  | "LANGUAGE_FUNDAMENTALS"
  | "OOP"
  | "COLLECTIONS"
  | "MEMORY_MANAGEMENT";
export type ProblemKind = "CODING" | "THEORY";
export type Track = "GENERAL" | "JAVA" | "CPP";
export type SessionStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
export type Verdict = "STRONG_HIRE" | "HIRE" | "LEANING_NO" | "NO";

export interface ProblemSummary {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topic: Topic;
  kind: ProblemKind;
  track: Track;
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
  starterCodeJava: string;
  starterCodeCpp: string;
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

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface PracticeStats {
  totalSessions: number;
  completedSessions: number;
  gradedSessions: number;
  positiveRate: number | null;
  totalPracticeSec: number;
  avgDurationSec: number | null;
  streakDays: number;
  distinctProblems: number;
  byVerdict: Record<string, number>;
  byTopic: Record<string, { total: number; positive: number }>;
  byDifficulty: Record<string, number>;
  timeline: {
    id: string;
    title: string;
    verdict: Verdict;
    startedAt: string;
    durationSec: number | null;
  }[];
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
