import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { PracticeStats } from "../lib/types";
import { PageShell } from "../components/SiteNav";
import {
  Badge,
  Card,
  ErrorNote,
  Eyebrow,
  LinkButton,
  SectionMark,
  Spinner,
  StatBlock,
  TOPIC_LABELS,
  VERDICT_LABELS,
  VERDICT_TONE,
  type BadgeTone,
} from "../components/ui";

const VERDICT_ORDER = ["STRONG_HIRE", "HIRE", "LEANING_NO", "NO"] as const;

const BAR_FILL: Record<BadgeTone, string> = {
  neutral: "bg-ink-ghost",
  mint: "bg-[#269684]",
  amber: "bg-[#e46d4c]",
  crimson: "bg-crimson",
  violet: "bg-violet",
};

function formatDuration(sec: number | null): string {
  if (sec == null || sec === 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function EmptyState() {
  return (
    <Card className="p-16 text-center">
      <h2 className="font-display text-2xl font-semibold text-ink-bright">
        No sessions yet
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-faint">
        Your dashboard fills in as you practice. Run your first interview and the numbers start
        here.
      </p>
      <div className="mt-8 flex justify-center">
        <LinkButton to="/practice" variant="primary">
          Start your first interview
        </LinkButton>
      </div>
    </Card>
  );
}

/** Horizontal distribution bar — one row per verdict. */
function VerdictBreakdown({ stats }: { stats: PracticeStats }) {
  const total = stats.gradedSessions;

  return (
    <Card className="p-6">
      <Eyebrow>Verdict distribution</Eyebrow>
      <div className="mt-6 space-y-4">
        {VERDICT_ORDER.map((v) => {
          const count = stats.byVerdict[v] ?? 0;
          const pct = total ? Math.round((count / total) * 100) : 0;
          const tone = VERDICT_TONE[v] ?? "neutral";
          return (
            <div key={v}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-ink-muted">{VERDICT_LABELS[v]}</span>
                <span className="font-mono text-xs tabular-nums text-ink-ghost">
                  {count} · {pct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-pill bg-surface-raised">
                <div
                  className={`h-full rounded-pill transition-all duration-700 ${BAR_FILL[tone]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TopicBreakdown({ stats }: { stats: PracticeStats }) {
  const rows = Object.entries(stats.byTopic).sort((a, b) => b[1].total - a[1].total);

  return (
    <Card className="p-6">
      <Eyebrow>Strength by topic</Eyebrow>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-ink-ghost">
          Grade a few sessions and your topic profile appears here.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map(([topic, { total, positive }]) => {
            const pct = Math.round((positive / total) * 100);
            const tone: BadgeTone = pct >= 66 ? "mint" : pct >= 34 ? "amber" : "crimson";
            return (
              <div key={topic}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-ink-muted">{TOPIC_LABELS[topic] ?? topic}</span>
                  <span className="font-mono text-xs tabular-nums text-ink-ghost">
                    {positive}/{total} positive
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-pill bg-surface-raised">
                  <div
                    className={`h-full rounded-pill transition-all duration-700 ${BAR_FILL[tone]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/** Verdict trend — each graded session as a rising/falling step. */
function TrendStrip({ stats }: { stats: PracticeStats }) {
  const SCORE: Record<string, number> = { NO: 1, LEANING_NO: 2, HIRE: 3, STRONG_HIRE: 4 };
  const points = stats.timeline.slice(-14);

  if (points.length < 2) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <Eyebrow>Verdict trend</Eyebrow>
        <span className="font-mono text-eyebrow uppercase text-ink-ghost">
          last {points.length}
        </span>
      </div>

      <div className="mt-8 flex h-32 items-end gap-2">
        {points.map((p) => {
          const score = SCORE[p.verdict] ?? 1;
          const tone = VERDICT_TONE[p.verdict] ?? "neutral";
          return (
            <Link
              key={p.id}
              to={`/evaluation/${p.id}`}
              title={`${p.title} — ${VERDICT_LABELS[p.verdict]}`}
              className="group relative flex-1"
              style={{ height: `${(score / 4) * 100}%` }}
            >
              <div
                className={`h-full w-full rounded-t-md opacity-75 transition-opacity group-hover:opacity-100 ${BAR_FILL[tone]}`}
              />
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-surface-border pt-4 text-xs text-ink-ghost">
        <span>Oldest</span>
        <span>Newest</span>
      </div>
    </Card>
  );
}

function RecentSessions({ stats }: { stats: PracticeStats }) {
  const recent = stats.timeline.slice(-6).reverse();
  if (recent.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <Eyebrow>Recent debriefs</Eyebrow>
        <Link to="/history" className="text-xs text-ink-faint transition-colors hover:text-ink-bright">
          View all →
        </Link>
      </div>

      <div className="mt-5 divide-y divide-[rgba(186,215,247,0.09)]">
        {recent.map((s) => (
          <Link
            key={s.id}
            to={`/evaluation/${s.id}`}
            className="group flex items-center justify-between gap-4 py-3.5 transition-colors first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-ink transition-colors group-hover:text-ink-bright">
                {s.title}
              </p>
              <p className="mt-0.5 text-xs text-ink-ghost">
                {new Date(s.startedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
                {s.durationSec ? ` · ${Math.round(s.durationSec / 60)}m` : ""}
              </p>
            </div>
            <Badge tone={VERDICT_TONE[s.verdict] ?? "neutral"}>
              {VERDICT_LABELS[s.verdict] ?? s.verdict}
            </Badge>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<PracticeStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load stats"));
  }, []);

  return (
    <PageShell>
      <div className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-crimson" />
          <Eyebrow className="text-crimson">Your practice record</Eyebrow>
        </div>

        <h1 className="mt-6 font-display text-display-lg font-bold uppercase text-ink-bright">
          Dashboard
        </h1>

        {error && (
          <div className="mt-8">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        {!stats && !error && (
          <div className="mt-12">
            <Spinner label="Crunching your sessions..." />
          </div>
        )}

        {stats && stats.totalSessions === 0 && (
          <div className="mt-12">
            <EmptyState />
          </div>
        )}

        {stats && stats.totalSessions > 0 && (
          <>
            <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatBlock
                label="Sessions"
                value={stats.totalSessions}
                hint={`${stats.completedSessions} completed`}
              />
              <StatBlock
                label="Positive rate"
                value={stats.positiveRate === null ? "—" : `${stats.positiveRate}%`}
                hint={`across ${stats.gradedSessions} graded`}
                tone={
                  stats.positiveRate === null
                    ? "neutral"
                    : stats.positiveRate >= 66
                      ? "mint"
                      : stats.positiveRate >= 34
                        ? "amber"
                        : "crimson"
                }
              />
              <StatBlock
                label="Day streak"
                value={stats.streakDays}
                hint={stats.streakDays > 0 ? "keep it alive" : "practice today to start"}
                tone={stats.streakDays > 0 ? "violet" : "neutral"}
              />
              <StatBlock
                label="Time practiced"
                value={formatDuration(stats.totalPracticeSec)}
                hint={
                  stats.avgDurationSec
                    ? `${Math.round(stats.avgDurationSec / 60)}m average`
                    : undefined
                }
              />
            </div>

            <div className="mt-16">
              <SectionMark>Where you stand</SectionMark>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <VerdictBreakdown stats={stats} />
              <TopicBreakdown stats={stats} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TrendStrip stats={stats} />
              <RecentSessions stats={stats} />
            </div>

            <div className="mt-10 flex justify-center">
              <LinkButton to="/practice" variant="primary" size="lg">
                Run another interview
              </LinkButton>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
