import type { ProblemDetail } from "../lib/types";
import { Badge, DIFFICULTY_TONE, Eyebrow, TOPIC_LABELS } from "./ui";

function InlineCode({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, j) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={j}
            className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-[0.85em] text-[#a68cff] shadow-hairline"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={j}>{part}</span>
        ),
      )}
    </>
  );
}

/** Renders a minimal markdown subset: paragraphs, `code`, `## headings`, and bullet lists. */
function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Group consecutive "- " lines into a single <ul>; "## " lines become
  // headings; everything else renders as <p>.
  const grouped: (
    | { type: "list"; items: string[] }
    | { type: "p"; text: string }
    | { type: "h"; text: string }
  )[] = [];
  for (const line of lines) {
    if (line.startsWith("## ")) {
      grouped.push({ type: "h", text: line.slice(3) });
      continue;
    }
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
    <div className="space-y-2.5">
      {grouped.map((block, i) =>
        block.type === "list" ? (
          <ul key={i} className="space-y-1.5">
            {block.items.map((item, j) => (
              <li key={j} className="ml-4 list-disc leading-relaxed text-ink-muted marker:text-ink-ghost">
                <InlineCode text={item} />
              </li>
            ))}
          </ul>
        ) : block.type === "h" ? (
          <div key={i} className="pt-4">
            <Eyebrow>{block.text}</Eyebrow>
          </div>
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
    <div className="flex h-full flex-col overflow-y-auto px-6 py-6 text-sm">
      <div className="flex items-center gap-2.5">
        <Badge tone={DIFFICULTY_TONE[problem.difficulty] ?? "neutral"}>
          {problem.difficulty}
        </Badge>
        <span className="text-xs text-ink-ghost">
          {TOPIC_LABELS[problem.topic] ?? problem.topic}
        </span>
      </div>

      <h1 className="mb-5 mt-4 font-display text-2xl font-bold leading-tight text-ink-bright">
        {problem.title}
      </h1>

      <SimpleMarkdown text={problem.prompt} />

      <div className="mb-3 mt-8">
        <Eyebrow>{problem.kind === "THEORY" ? "How this works" : "Constraints"}</Eyebrow>
      </div>
      <SimpleMarkdown text={problem.constraints} />

      {problem.examples.length > 0 && (
        <div className="mb-3 mt-8">
          <Eyebrow>Examples</Eyebrow>
        </div>
      )}
      <div className="space-y-3">
        {problem.examples.map((ex, i) => (
          <div key={i} className="rounded-control bg-surface-raised p-3.5 shadow-hairline">
            <div className="font-mono text-xs leading-relaxed text-ink-muted">
              <span className="text-ink-ghost">Input: </span>
              {ex.input}
            </div>
            <div className="mt-1 font-mono text-xs leading-relaxed text-ink-muted">
              <span className="text-ink-ghost">Output: </span>
              {ex.output}
            </div>
            {ex.explanation && (
              <div className="mt-2 border-t border-surface-border pt-2 text-xs leading-relaxed text-ink-ghost">
                {ex.explanation}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
