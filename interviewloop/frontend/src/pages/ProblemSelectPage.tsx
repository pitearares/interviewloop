import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { ProblemSummary, Track } from "../lib/types";
import { PageShell } from "../components/SiteNav";
import {
  Badge,
  Button,
  Card,
  DIFFICULTY_TONE,
  ErrorNote,
  Eyebrow,
  Spinner,
  TOPIC_LABELS,
  TRACK_LABELS,
} from "../components/ui";

type Language = "javascript" | "python";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
];

const TRACKS: { value: Track; label: string; hint: string }[] = [
  { value: "GENERAL", label: "General", hint: "Algorithm problems in JS or Python" },
  { value: "JAVA", label: "Java", hint: "Junior Java — oral theory + coding" },
  { value: "CPP", label: "C++", hint: "Junior C++ — oral theory + coding" },
];

/** Language sent to the backend for each track's coding problems. */
const TRACK_LANGUAGE: Record<Track, string> = {
  GENERAL: "javascript", // overridden by the JS/Py selector
  JAVA: "java",
  CPP: "cpp",
};

const DIFFICULTIES = ["EASY", "MEDIUM"] as const;

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-pill px-3.5 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-crimson text-white shadow-glow-crimson"
          : "bg-surface-raised text-ink-faint shadow-hairline hover:text-ink-bright"
      }`}
    >
      {children}
    </button>
  );
}

function ProblemCard({
  problem,
  starting,
  onStart,
}: {
  problem: ProblemSummary;
  starting: boolean;
  onStart: () => void;
}) {
  return (
    <button
      onClick={onStart}
      disabled={starting}
      className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-card glass p-6 text-left shadow-hairline transition-all duration-200 hover:shadow-lift disabled:cursor-wait"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge tone={DIFFICULTY_TONE[problem.difficulty] ?? "neutral"}>
            {problem.difficulty}
          </Badge>
          {problem.kind === "THEORY" && <Badge tone="violet">Oral</Badge>}
        </div>
        <span className="font-mono text-eyebrow uppercase text-ink-ghost opacity-0 transition-opacity group-hover:opacity-100">
          Start →
        </span>
      </div>

      <h3 className="font-display text-xl font-semibold leading-tight text-ink-bright transition-colors group-hover:text-crimson">
        {problem.title}
      </h3>

      <span className="mt-auto text-xs text-ink-ghost">
        {TOPIC_LABELS[problem.topic] ?? problem.topic}
      </span>

      {starting && (
        <div className="absolute inset-0 flex items-center justify-center rounded-card bg-[rgba(5,6,15,0.82)] backdrop-blur-sm">
          <Spinner label="Opening the room..." />
        </div>
      )}
    </button>
  );
}

export default function ProblemSelectPage() {
  const [problems, setProblems] = useState<ProblemSummary[] | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [track, setTrack] = useState<Track>("GENERAL");
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("javascript");

  const navigate = useNavigate();

  useEffect(() => {
    api
      .getProblems()
      .then(setProblems)
      .catch((err) => setError(err.message));
  }, []);

  const inTrack = useMemo(
    () => (problems ?? []).filter((p) => (p.track ?? "GENERAL") === track),
    [problems, track],
  );

  const topics = useMemo(() => [...new Set(inTrack.map((p) => p.topic))], [inTrack]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inTrack.filter((p) => {
      if (difficulty && p.difficulty !== difficulty) return false;
      if (topic && p.topic !== topic) return false;
      if (q && !p.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [inTrack, query, difficulty, topic]);

  function switchTrack(next: Track) {
    setTrack(next);
    setTopic(null); // topics differ per track — a stale filter would empty the list
  }

  async function startInterview(problem: ProblemSummary) {
    setStarting(problem.id);
    setError(null);
    try {
      const sessionLanguage = track === "GENERAL" ? language : TRACK_LANGUAGE[track];
      const session = await api.createSession(problem.id, sessionLanguage);
      navigate(`/interview/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
      setStarting(null);
    }
  }

  const filtersActive = difficulty !== null || topic !== null || query.trim() !== "";

  return (
    <PageShell>
      <div className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-crimson" />
          <Eyebrow className="text-crimson">The problem bank</Eyebrow>
        </div>

        <h1 className="mt-6 max-w-2xl font-display text-display-lg font-bold uppercase text-ink-bright">
          Choose your track
        </h1>
        <p className="mt-5 max-w-xl text-base leading-snug text-ink-muted">
          Pick a track, then a session. The interviewer joins the moment the room opens.
        </p>

        {/* Track tabs */}
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TRACKS.map((t) => (
            <button
              key={t.value}
              onClick={() => switchTrack(t.value)}
              className={`rounded-card p-5 text-left transition-all duration-200 ${
                track === t.value
                  ? "glass shadow-lift"
                  : "bg-surface-raised shadow-hairline hover:bg-[rgba(186,214,247,0.09)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-display text-lg font-semibold ${
                    track === t.value ? "text-crimson" : "text-ink-bright"
                  }`}
                >
                  {t.label}
                </span>
                {track === t.value && (
                  <span className="h-2 w-2 rounded-full bg-crimson shadow-glow-crimson" />
                )}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">{t.hint}</p>
            </button>
          ))}
        </div>

        {/* Controls */}
        <Card className="mt-4 p-5">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
            {track === "GENERAL" ? (
              <div>
                <Eyebrow>Language</Eyebrow>
                <div className="mt-2.5 flex gap-2">
                  {LANGUAGES.map((l) => (
                    <FilterPill
                      key={l.value}
                      active={language === l.value}
                      onClick={() => setLanguage(l.value)}
                    >
                      {l.label}
                    </FilterPill>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <Eyebrow>Language</Eyebrow>
                <p className="mt-2.5 text-sm text-ink-muted">
                  {TRACK_LABELS[track]} — coding sessions use it, oral sessions are chat-only.
                </p>
              </div>
            )}

            <div>
              <Eyebrow>Difficulty</Eyebrow>
              <div className="mt-2.5 flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <FilterPill
                    key={d}
                    active={difficulty === d}
                    onClick={() => setDifficulty(difficulty === d ? null : d)}
                  >
                    {d}
                  </FilterPill>
                ))}
              </div>
            </div>

            <div className="min-w-[220px] flex-1">
              <Eyebrow>Search</Eyebrow>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by title..."
                className="mt-2.5 w-full rounded-control bg-surface-raised px-3.5 py-2 text-sm text-ink-bright shadow-hairline outline-none transition-shadow placeholder:text-ink-ghost focus:shadow-[inset_0_0_0_1px_rgba(186,215,247,0.28)]"
              />
            </div>
          </div>

          {topics.length > 1 && (
            <div className="mt-5 border-t border-surface-border pt-5">
              <Eyebrow>Topic</Eyebrow>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {topics.map((t) => (
                  <FilterPill
                    key={t}
                    active={topic === t}
                    onClick={() => setTopic(topic === t ? null : t)}
                  >
                    {TOPIC_LABELS[t] ?? t}
                  </FilterPill>
                ))}
              </div>
            </div>
          )}
        </Card>

        {error && (
          <div className="mt-6">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        {!problems && (
          <div className="mt-12">
            <Spinner label="Loading the bank..." />
          </div>
        )}

        {problems && (
          <>
            <div className="mt-10 flex items-center justify-between">
              <Eyebrow>
                {visible.length} {visible.length === 1 ? "problem" : "problems"}
              </Eyebrow>
              {filtersActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDifficulty(null);
                    setTopic(null);
                    setQuery("");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>

            {visible.length === 0 ? (
              <Card className="mt-6 p-12 text-center">
                <p className="text-sm text-ink-faint">
                  Nothing matches those filters. Try widening the search.
                </p>
              </Card>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((p) => (
                  <ProblemCard
                    key={p.id}
                    problem={p}
                    starting={starting === p.id}
                    onStart={() => startInterview(p)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
