import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import type { ProblemSummary } from "../lib/types";

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  MEDIUM: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

const TOPIC_LABELS: Record<string, string> = {
  ARRAYS_STRINGS: "Arrays & Strings",
  ALGORITHMS: "Algorithms",
  DATA_STRUCTURES: "Data Structures",
  DYNAMIC_PROGRAMMING: "Dynamic Programming",
};

function ProblemCard({ problem, onStart }: { problem: ProblemSummary; onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className="group flex flex-col items-start gap-3 rounded-xl border border-surface-border bg-surface-panel p-5 text-left transition-all hover:border-accent/40 hover:bg-surface-raised"
    >
      <span
        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
          DIFFICULTY_STYLES[problem.difficulty] ?? ""
        }`}
      >
        {problem.difficulty}
      </span>
      <h3 className="text-base font-semibold text-ink group-hover:text-accent">{problem.title}</h3>
      <span className="text-xs text-ink-faint">{TOPIC_LABELS[problem.topic] ?? problem.topic}</span>
    </button>
  );
}

export default function ProblemSelectPage() {
  const [problems, setProblems] = useState<ProblemSummary[] | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getProblems()
      .then(setProblems)
      .catch((err) => setError(err.message));
  }, []);

  async function startInterview(problem: ProblemSummary) {
    setStarting(problem.id);
    setError(null);
    try {
      const session = await api.createSession(problem.id, "javascript");
      navigate(`/interview/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
      setStarting(null);
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">InterviewLoop</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Pick a problem and practice with an adaptive AI interviewer.
          </p>
        </div>
        <Link
          to="/history"
          className="rounded-lg border border-surface-border px-3.5 py-2 text-sm text-ink-muted transition-colors hover:border-accent/40 hover:text-ink"
        >
          History
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {!problems && <p className="text-sm text-ink-faint">Loading problems...</p>}

      {problems && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((p) => (
            <div key={p.id} className="relative">
              <ProblemCard problem={p} onStart={() => startInterview(p)} />
              {starting === p.id && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface-panel/80">
                  <span className="text-sm text-ink-muted">Starting...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
