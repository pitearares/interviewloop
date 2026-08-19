import type { ProblemDetail } from "../lib/types";

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  MEDIUM: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

function InlineCode({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, j) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={j} className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-[0.85em] text-accent">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={j}>{part}</span>
        ),
      )}
    </>
  );
}

/** Renders a minimal markdown subset: paragraphs, `code`, and bullet lists. */
function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Group consecutive "- " lines into a single <ul>, everything else as <p>.
  const grouped: ({ type: "list"; items: string[] } | { type: "p"; text: string })[] = [];
  for (const line of lines) {
    const isBullet = line.startsWith("- ");
    const last = grouped[grouped.length - 1];
    if (isBullet) {
      if (last?.type === "list") {
        last.items.push(line.slice(2));
      } else {
        grouped.push({ type: "list", items: [line.slice(2)] });
      }
    } else {
      grouped.push({ type: "p", text: line });
    }
  }

  return (
    <div className="space-y-2">
      {grouped.map((block, i) =>
        block.type === "list" ? (
          <ul key={i} className="space-y-1">
            {block.items.map((item, j) => (
              <li key={j} className="ml-4 list-disc text-ink-muted">
                <InlineCode text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="leading-relaxed text-ink-muted">
            <InlineCode text={block.text} />
          </p>
        ),
      )}
    </div>
  );
}

export function ProblemPanel({ problem }: { problem: ProblemDetail }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 py-6">
      <div className="mb-4 flex items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            DIFFICULTY_STYLES[problem.difficulty] ?? ""
          }`}
        >
          {problem.difficulty}
        </span>
        <span className="text-xs text-ink-faint">{problem.topic.replace(/_/g, " ").toLowerCase()}</span>
      </div>

      <h1 className="mb-4 text-lg font-semibold text-ink">{problem.title}</h1>

      <SimpleMarkdown text={problem.prompt} />

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-ink-faint">
        Constraints
      </h2>
      <SimpleMarkdown text={problem.constraints} />

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-ink-faint">
        Examples
      </h2>
      <div className="space-y-3">
        {problem.examples.map((ex, i) => (
          <div key={i} className="rounded-lg border border-surface-border bg-surface-raised p-3 text-sm">
            <div className="font-mono text-ink-muted">
              <span className="text-ink-faint">Input: </span>
              {ex.input}
            </div>
            <div className="font-mono text-ink-muted">
              <span className="text-ink-faint">Output: </span>
              {ex.output}
            </div>
            {ex.explanation && (
              <div className="mt-1 text-ink-faint">{ex.explanation}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
