import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { EvaluationReport, Verdict } from "../lib/types";

const VERDICT_META: Record<Verdict, { label: string; sub: string; classes: string }> = {
  STRONG_HIRE: {
    label: "Strong Hire",
    sub: "In a real interview, this session would have read as a clear yes.",
    classes: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  HIRE: {
    label: "Hire",
    sub: "A solid session — this would likely have read as a yes.",
    classes: "border-accent/30 bg-accent/10 text-accent",
  },
  LEANING_NO: {
    label: "Leaning No",
    sub: "Close, but this session would probably not have cleared the bar yet.",
    classes: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
  NO: {
    label: "No",
    sub: "This one didn't land — the advice below is where to focus.",
    classes: "border-red-400/30 bg-red-400/10 text-red-300",
  },
};

function GeneratingState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
      </div>
      <p className="text-sm text-ink-muted">Your interviewer is writing up the debrief...</p>
      <p className="text-xs text-ink-faint">This usually takes a few seconds.</p>
    </div>
  );
}

function ReportSection({
  title,
  children,
  delay,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <section
      className="animate-report-in rounded-xl border border-surface-border bg-surface-panel p-5 opacity-0 [animation-fill-mode:forwards]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{title}</h2>
      <div className="text-sm leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}

export default function EvaluationPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [problemTitle, setProblemTitle] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function load() {
      try {
        // Grab the problem title for the header (cheap), then the report
        // (generated on demand — the slow part).
        api
          .getSession(sessionId!)
          .then((s) => !cancelled && setProblemTitle(s.problem.title))
          .catch(() => {});
        const r = await api.evaluateSession(sessionId!);
        if (!cancelled) setReport(r);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to generate the report");
        }
      }
    }
    void load();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-300">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setError(null);
              setReport(null);
              api
                .evaluateSession(sessionId!)
                .then(setReport)
                .catch((err) =>
                  setError(err instanceof Error ? err.message : "Failed to generate the report"),
                );
            }}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            Try again
          </button>
          <Link
            to="/history"
            className="rounded-lg border border-surface-border px-4 py-2 text-sm text-ink-muted hover:text-ink"
          >
            Back to history
          </Link>
        </div>
      </div>
    );
  }

  if (!report) return <GeneratingState />;

  const verdict = VERDICT_META[report.verdict] ?? VERDICT_META.LEANING_NO;

  return (
    <div className="mx-auto min-h-full max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Interview debrief
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">{problemTitle || "Your session"}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            to="/history"
            className="rounded-lg border border-surface-border px-3.5 py-2 text-sm text-ink-muted transition-colors hover:border-accent/40 hover:text-ink"
          >
            History
          </Link>
          <Link
            to="/"
            className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
          >
            Practice again
          </Link>
        </div>
      </div>

      <div
        className={`animate-report-in mb-6 rounded-xl border p-6 opacity-0 [animation-fill-mode:forwards] ${verdict.classes}`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Verdict</p>
        <p className="mt-1 text-2xl font-semibold">{verdict.label}</p>
        <p className="mt-1 text-sm opacity-80">{verdict.sub}</p>
      </div>

      <div className="space-y-4">
        <ReportSection title="Correctness" delay={120}>
          {report.correctness}
        </ReportSection>
        <ReportSection title="Communication" delay={220}>
          {report.communication}
        </ReportSection>
        <ReportSection title="Code quality" delay={320}>
          {report.codeQuality}
        </ReportSection>
        <ReportSection title="Advice for next time" delay={420}>
          <ul className="space-y-2">
            {report.advice.map((item, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-xs text-accent">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </ReportSection>
      </div>
    </div>
  );
}
