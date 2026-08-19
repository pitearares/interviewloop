import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { InterviewSessionSummary } from "../lib/types";
import { PageShell } from "../components/SiteNav";
import {
  Badge,
  Card,
  DIFFICULTY_TONE,
  ErrorNote,
  Eyebrow,
  LinkButton,
  Spinner,
  VERDICT_LABELS,
  VERDICT_TONE,
} from "../components/ui";

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "graded", label: "Graded" },
  { value: "IN_PROGRESS", label: "In progress" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(sec: number | null): string {
  if (sec == null) return "—";
  return `${Math.max(1, Math.round(sec / 60))}m`;
}

function SessionRow({ session }: { session: InterviewSessionSummary }) {
  const inner = (
    <div className="glass flex items-center justify-between gap-4 rounded-card px-6 py-5 shadow-hairline transition-all duration-200 hover:shadow-lift">
      <div className="flex min-w-0 items-center gap-4">
        <Badge tone={DIFFICULTY_TONE[session.problem.difficulty] ?? "neutral"}>
          {session.problem.difficulty}
        </Badge>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-ink-bright">
            {session.problem.title}
          </p>
          <p className="mt-1 text-xs text-ink-ghost">
            {formatDate(session.startedAt)} · {formatDuration(session.durationSec)}
          </p>
        </div>
      </div>

      {session.evaluationReport ? (
        <Badge tone={VERDICT_TONE[session.evaluationReport.verdict] ?? "neutral"}>
          {VERDICT_LABELS[session.evaluationReport.verdict] ?? session.evaluationReport.verdict}
        </Badge>
      ) : (
        <span className="shrink-0 font-mono text-eyebrow uppercase text-ink-ghost">
          {STATUS_LABELS[session.status] ?? session.status}
        </span>
      )}
    </div>
  );

  if (session.evaluationReport) {
    return <Link to={`/evaluation/${session.id}`}>{inner}</Link>;
  }
  if (session.status === "IN_PROGRESS") {
    return <Link to={`/interview/${session.id}`}>{inner}</Link>;
  }
  return inner;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<InterviewSessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    api
      .getSessions()
      .then(setSessions)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history"));
  }, []);

  const visible = useMemo(() => {
    if (!sessions) return [];
    if (filter === "all") return sessions;
    if (filter === "graded") return sessions.filter((s) => s.evaluationReport !== null);
    return sessions.filter((s) => s.status === filter);
  }, [sessions, filter]);

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-crimson" />
          <Eyebrow className="text-crimson">Every run, recorded</Eyebrow>
        </div>

        <h1 className="mt-6 font-display text-display-lg font-bold uppercase text-ink-bright">
          History
        </h1>

        {sessions && sessions.length > 0 && (
          <div className="mt-10 flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-pill px-3.5 py-1.5 text-xs font-medium transition-all ${
                  filter === f.value
                    ? "bg-crimson text-white shadow-glow-crimson"
                    : "bg-surface-raised text-ink-faint shadow-hairline hover:text-ink-bright"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-8">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        {!sessions && !error && (
          <div className="mt-12">
            <Spinner />
          </div>
        )}

        {sessions && sessions.length === 0 && (
          <Card className="mt-12 p-16 text-center">
            <h2 className="font-display text-2xl font-semibold text-ink-bright">
              Nothing here yet
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-faint">
              Your sessions land here the moment you finish one.
            </p>
            <div className="mt-8 flex justify-center">
              <LinkButton to="/practice" variant="primary">
                Start your first interview
              </LinkButton>
            </div>
          </Card>
        )}

        {sessions && sessions.length > 0 && (
          <div className="mt-6 space-y-3">
            {visible.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-sm text-ink-faint">No sessions match that filter.</p>
              </Card>
            ) : (
              visible.map((s) => <SessionRow key={s.id} session={s} />)
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
