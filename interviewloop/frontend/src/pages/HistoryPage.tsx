import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { InterviewSessionSummary } from "../lib/types";

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  MEDIUM: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

const VERDICT_STYLES: Record<string, string> = {
  STRONG_HIRE: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  HIRE: "text-accent bg-accent/10 border-accent/20",
  LEANING_NO: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  NO: "text-red-400 bg-red-400/10 border-red-400/20",
};

const VERDICT_LABELS: Record<string, string> = {
  STRONG_HIRE: "Strong Hire",
  HIRE: "Hire",
  LEANING_NO: "Leaning No",
  NO: "No",
};

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(sec: number | null): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  return `${m}m`;
}

function SessionRow({ session }: { session: InterviewSessionSummary }) {
  const content = (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-surface-border bg-surface-panel px-5 py-4 transition-colors hover:border-accent/40 hover:bg-surface-raised">
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
            DIFFICULTY_STYLES[session.problem.difficulty] ?? ""
          }`}
        >
          {session.problem.difficulty}
        </span>
        <div>
          <p className="text-sm font-medium text-ink">{session.problem.title}</p>
          <p className="text-xs text-ink-faint">
            {formatDate(session.startedAt)} &middot; {formatDuration(session.durationSec)}
          </p>
        </div>
      </div>

      {session.evaluationReport ? (
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
            VERDICT_STYLES[session.evaluationReport.verdict] ?? ""
          }`}
        >
          {VERDICT_LABELS[session.evaluationReport.verdict] ?? session.evaluationReport.verdict}
        </span>
      ) : (
        <span className="text-xs text-ink-faint">{STATUS_LABELS[session.status] ?? session.status}</span>
      )}
    </div>
  );

  if (session.evaluationReport) {
    return <Link to={`/evaluation/${session.id}`}>{content}</Link>;
  }
  if (session.status === "IN_PROGRESS") {
    return <Link to={`/interview/${session.id}`}>{content}</Link>;
  }
  return content;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<InterviewSessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSessions()
      .then(setSessions)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history"));
  }, []);

  return (
    <div className="mx-auto min-h-full max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">History</h1>
          <p className="mt-1 text-sm text-ink-muted">Track your practice sessions over time.</p>
        </div>
        <Link
          to="/"
          className="rounded-lg border border-surface-border px-3.5 py-2 text-sm text-ink-muted transition-colors hover:border-accent/40 hover:text-ink"
        >
          New interview
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {!sessions && <p className="text-sm text-ink-faint">Loading...</p>}

      {sessions && sessions.length === 0 && (
        <p className="text-sm text-ink-faint">No sessions yet — start your first interview.</p>
      )}

      {sessions && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}
