import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { EvaluationReport, Verdict } from "../lib/types";
import { PageShell } from "../components/SiteNav";
import {
  Button,
  Eyebrow,
  LinkButton,
  SectionMark,
  VERDICT_LABELS,
  VERDICT_TONE,
  type BadgeTone,
} from "../components/ui";

const VERDICT_SUB: Record<Verdict, string> = {
  STRONG_HIRE: "In a real interview, this session would have read as a clear yes.",
  HIRE: "A solid session — this would likely have read as a yes.",
  LEANING_NO: "Close, but this session would probably not have cleared the bar yet.",
  NO: "This one didn't land — the advice below is where to focus.",
};

const VERDICT_SURFACE: Record<BadgeTone, string> = {
  neutral: "text-ink-bright",
  mint: "text-[#6fdcc6] shadow-[inset_0_0_0_1px_rgba(38,150,132,0.34)]",
  amber: "text-[#f09b7f] shadow-[inset_0_0_0_1px_rgba(228,109,76,0.34)]",
  crimson: "text-[#ff6b87] shadow-[inset_0_0_0_1px_rgba(252,28,70,0.32)]",
  violet: "text-[#a68cff] shadow-[inset_0_0_0_1px_rgba(102,58,243,0.36)]",
};

function GeneratingState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet [animation-delay:-0.3s]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet [animation-delay:-0.15s]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet" />
      </div>
      <div>
        <p className="font-display text-2xl font-semibold text-ink-bright">
          Writing up the debrief
        </p>
        <p className="mt-2 text-sm text-ink-faint">
          Your interviewer is reviewing the transcript and your final code.
        </p>
      </div>
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
      className="glass animate-report-in rounded-card p-7 opacity-0 shadow-hairline [animation-fill-mode:forwards]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Eyebrow>{title}</Eyebrow>
      <div className="mt-4 text-sm leading-relaxed text-ink-muted">{children}</div>
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
      <PageShell>
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="text-sm text-[#ff6b87]">{error}</p>
          <div className="flex gap-3">
            <Button
              variant="primary"
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
            >
              Try again
            </Button>
            <LinkButton to="/history" variant="outline">
              Back to history
            </LinkButton>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!report) {
    return (
      <PageShell>
        <GeneratingState />
      </PageShell>
    );
  }

  const tone = VERDICT_TONE[report.verdict] ?? "neutral";

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-crimson" />
          <Eyebrow className="text-crimson">Interview debrief</Eyebrow>
        </div>

        <h1 className="mt-6 font-display text-display-md font-bold uppercase text-ink-bright">
          {problemTitle || "Your session"}
        </h1>

        {/* Verdict */}
        <div
          className={`glass animate-report-in mt-10 rounded-card p-9 text-center opacity-0 [animation-fill-mode:forwards] ${VERDICT_SURFACE[tone]}`}
        >
          <Eyebrow>Verdict</Eyebrow>
          <p className="mt-4 font-display text-display-md font-bold uppercase">
            {VERDICT_LABELS[report.verdict] ?? report.verdict}
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-faint">
            {VERDICT_SUB[report.verdict]}
          </p>
        </div>

        <div className="mt-14">
          <SectionMark>The breakdown</SectionMark>
        </div>

        <div className="mt-10 space-y-4">
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
            <ul className="space-y-3.5">
              {report.advice.map((item, i) => (
                <li key={i} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-crimson-soft font-mono text-[0.65rem] text-[#ff6b87] shadow-[inset_0_0_0_1px_rgba(252,28,70,0.32)]">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{item}</span>
                </li>
              ))}
            </ul>
          </ReportSection>
        </div>

        <div className="mt-12 flex justify-center gap-3">
          <LinkButton to="/practice" variant="primary" size="lg">
            Practice again
          </LinkButton>
          <LinkButton to="/dashboard" variant="outline" size="lg">
            View dashboard
          </LinkButton>
        </div>
      </div>
    </PageShell>
  );
}
