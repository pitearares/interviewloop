import type { RunResult } from "../lib/types";

function stringify(value: unknown): string {
  return JSON.stringify(value);
}

export function RunResultsPanel({ result }: { result: RunResult }) {
  if (result.runtimeError) {
    return (
      <div className="border-t border-surface-border bg-surface-raised px-4 py-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-400">Runtime error</p>
        <pre className="whitespace-pre-wrap font-mono text-xs text-red-300">{result.runtimeError}</pre>
      </div>
    );
  }

  return (
    <div className="max-h-56 overflow-y-auto border-t border-surface-border bg-surface-raised px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Test results</p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            result.allPassed ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
          }`}
        >
          {result.results.filter((r) => r.passed).length} / {result.results.length} passed
        </span>
      </div>
      <div className="space-y-1.5">
        {result.results.map((r, i) => (
          <div
            key={i}
            className={`rounded-md border px-3 py-1.5 font-mono text-xs ${
              r.passed
                ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"
                : "border-red-400/20 bg-red-400/5 text-red-300"
            }`}
          >
            <div>
              Input: <span className="text-ink-muted">{stringify(r.input)}</span>
            </div>
            <div>
              Expected: <span className="text-ink-muted">{stringify(r.expected)}</span>
              {!r.passed && (
                <>
                  {" "}
                  &middot; Got: <span className="text-ink-muted">{r.error ?? stringify(r.actual)}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
