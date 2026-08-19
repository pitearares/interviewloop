import type { RunResult } from "../lib/types";
import { Badge } from "./ui";

function stringify(value: unknown): string {
  return JSON.stringify(value);
}

export function RunResultsPanel({ result }: { result: RunResult }) {
  if (result.runtimeError) {
    return (
      <div className="border-t border-surface-border px-5 py-4">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[#ff6b87]">
          Runtime error
        </span>
        <pre className="mt-2.5 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-control bg-crimson-soft p-3 font-mono text-xs leading-relaxed text-[#ff6b87] shadow-[inset_0_0_0_1px_rgba(252,28,70,0.32)]">
          {result.runtimeError}
        </pre>
      </div>
    );
  }

  const passed = result.results.filter((r) => r.passed).length;

  return (
    <div className="max-h-64 overflow-y-auto border-t border-surface-border px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-ghost">
          Test results
        </span>
        <Badge tone={result.allPassed ? "mint" : "crimson"}>
          {passed} / {result.results.length} passed
        </Badge>
      </div>

      <div className="space-y-2">
        {result.results.map((r, i) => (
          <div
            key={i}
            className={`rounded-control px-3.5 py-2.5 font-mono text-xs leading-relaxed ${
              r.passed
                ? "bg-mint-soft text-[#6fdcc6] shadow-[inset_0_0_0_1px_rgba(38,150,132,0.34)]"
                : "bg-crimson-soft text-[#ff6b87] shadow-[inset_0_0_0_1px_rgba(252,28,70,0.32)]"
            }`}
          >
            <div>
              <span className="opacity-60">Input: </span>
              <span className="text-ink-muted">{stringify(r.input)}</span>
            </div>
            <div className="mt-0.5">
              <span className="opacity-60">Expected: </span>
              <span className="text-ink-muted">{stringify(r.expected)}</span>
              {!r.passed && (
                <>
                  <span className="opacity-60"> · Got: </span>
                  <span className="text-ink-muted">{r.error ?? stringify(r.actual)}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
