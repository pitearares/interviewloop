import { PageShell } from "../components/SiteNav";
import { Card, Eyebrow, LinkButton, SectionMark } from "../components/ui";

/* Line-art glyphs, 1.5px stroke — the system's only iconography. */
const ICONS: Record<string, JSX.Element> = {
  eye: (
    <>
      <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" />
      <circle cx="10" cy="10" r="2.25" />
    </>
  ),
  chat: (
    <>
      <path d="M17 11.5a2.5 2.5 0 0 1-2.5 2.5H7l-4 3V5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5Z" />
    </>
  ),
  code: (
    <>
      <path d="m7 7-4 3 4 3M13 7l4 3-4 3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  clock: (
    <>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 5.5V10l3 1.75" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  report: (
    <>
      <path d="M5 3h7l3.5 3.5V17H5Z" strokeLinejoin="round" />
      <path d="M8 10.5h5M8 13.5h3.5" strokeLinecap="round" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 16.5h13" strokeLinecap="round" />
      <path d="M6.5 16.5v-4M10 16.5V6M13.5 16.5v-6.5" strokeLinecap="round" />
    </>
  ),
};

function Glyph({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className={className ?? "h-5 w-5"}
    >
      {ICONS[name]}
    </svg>
  );
}

const CAPABILITIES = [
  { icon: "eye" as const, label: "Watches your code", copy: "Live editor snapshots, not a chat box." },
  { icon: "chat" as const, label: "Speaks up rarely", copy: "A gate decides when silence is better." },
  { icon: "code" as const, label: "Runs your tests", copy: "Real execution against real cases." },
  { icon: "clock" as const, label: "Keeps the clock", copy: "Timed sessions with pressure that's real." },
  { icon: "report" as const, label: "Writes a debrief", copy: "Verdict, evidence, and next actions." },
  { icon: "chart" as const, label: "Tracks the trend", copy: "Every session feeds your dashboard." },
];

const STEPS = [
  {
    n: "01",
    title: "Pick your battle",
    copy: "Choose a problem by difficulty and topic, then set your language. The clock starts the moment you land in the room.",
  },
  {
    n: "02",
    title: "Think out loud",
    copy: "Your interviewer reads the editor as you type. Narrate your approach and it stays quiet; go silent and it will ask what you're building.",
  },
  {
    n: "03",
    title: "Read the verdict",
    copy: "Get a structured debrief grading correctness, communication, and code quality — with concrete advice for the next run.",
  },
];

function HeroMockup() {
  return (
    <div className="relative hidden lg:block">
      <div className="animate-drift">
        <Card className="w-[380px] p-5 shadow-lift">
          <div className="flex items-center gap-2.5 border-b border-surface-border pb-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-violet" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet" />
            </span>
            <span className="text-sm font-medium text-ink-bright">Interviewer</span>
            <span className="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-ghost">
              12:04
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="max-w-[85%] rounded-card rounded-tl-md bg-surface-raised px-3.5 py-2.5 text-sm leading-relaxed text-ink shadow-hairline">
              You're building a nested loop — what happens when the array hits ten thousand entries?
            </div>
            <div className="ml-auto max-w-[85%] rounded-card rounded-tr-md bg-violet-soft px-3.5 py-2.5 text-sm leading-relaxed text-ink shadow-[inset_0_0_0_1px_rgba(102,58,243,0.36)]">
              Right — that's O(n²). Let me swap it for a hash map in one pass.
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-ghost [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-ghost [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-ghost" />
            </div>
          </div>
        </Card>
      </div>

      <div className="absolute -bottom-14 -left-16 animate-drift [animation-delay:-3s]">
        <Card className="w-[240px] p-4 shadow-lift">
          <Eyebrow>Verdict</Eyebrow>
          <p className="mt-2 font-display text-2xl font-semibold text-[#6fdcc6]">Strong Hire</p>
          <div className="mt-3 space-y-1.5">
            {[92, 78, 85].map((w, i) => (
              <div key={i} className="h-1 overflow-hidden rounded-pill bg-surface-raised">
                <div
                  className="h-full rounded-pill bg-gradient-to-r from-violet to-[#98c0ef]"
                  style={{ width: `${w}%` }}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-6 pb-24 pt-20 lg:pt-28">
        <div className="flex items-start justify-between gap-16">
          <div className="max-w-3xl animate-rise-in">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-crimson" />
              <Eyebrow className="text-crimson">Adaptive AI interviewer</Eyebrow>
            </div>

            <h1 className="mt-7 font-display text-display-xl font-bold uppercase text-ink-bright">
              Practice
              <br />
              under
              <br />
              <span className="text-crimson">pressure</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-snug text-ink-muted">
              A live coding interview that watches you work. It reads your editor, asks the
              questions a real interviewer would, and hands you an honest debrief when the clock
              stops.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <LinkButton to="/practice" variant="primary" size="lg">
                Start an interview
              </LinkButton>
              <LinkButton to="/dashboard" variant="outline" size="lg">
                See your progress
              </LinkButton>
            </div>
          </div>

          <HeroMockup />
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <SectionMark>What it actually does</SectionMark>

        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <div key={c.label} className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-surface-raised text-ink shadow-hairline">
                <Glyph name={c.icon} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink-bright">{c.label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-faint">{c.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1280px] px-6 py-20">
        <SectionMark>How a session runs</SectionMark>

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.n} className="p-7">
              <span className="font-mono text-eyebrow uppercase text-crimson">{s.n}</span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-ink-bright">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-faint">{s.copy}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-[1280px] px-6 py-20">
        <Card className="overflow-hidden p-14 text-center shadow-lift">
          <h2 className="font-display text-display-md font-bold uppercase text-ink-bright">
            The loop closes when you improve
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ink-faint">
            Every session is recorded, graded, and folded into a trend you can actually read. Run
            it again tomorrow and watch the verdict move.
          </p>
          <div className="mt-9 flex justify-center">
            <LinkButton to="/practice" variant="primary" size="lg">
              Pick a problem
            </LinkButton>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
