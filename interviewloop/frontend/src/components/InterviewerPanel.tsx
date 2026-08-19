import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../lib/types";

interface InterviewerPanelProps {
  messages: ChatMessage[];
  thinking: boolean;
  onSend: (text: string) => void;
}

const KIND_LABEL: Record<string, string> = {
  INTERVIEWER_NUDGE: "Nudge",
};

function MessageBubble({ message }: { message: ChatMessage }) {
  const isCandidate = message.role === "candidate";
  const label = message.kind ? KIND_LABEL[message.kind] : undefined;

  return (
    <div
      className={`flex flex-col gap-1 ${isCandidate ? "items-end" : "items-start"} animate-message-in`}
    >
      {label && (
        <span className="px-1 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-400/80">
          {label}
        </span>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isCandidate
            ? "rounded-tr-sm bg-accent/15 text-ink"
            : "rounded-tl-sm bg-surface-raised text-ink"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-surface-raised px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint" />
      </div>
    </div>
  );
}

export function InterviewerPanel({ messages, thinking, onSend }: InterviewerPanelProps) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  function submit() {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col font-sans">
      <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-sm font-medium text-ink">Interviewer</span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !thinking && (
          <p className="text-sm text-ink-faint">Your interviewer will join shortly...</p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {thinking && <TypingIndicator />}
      </div>

      <div className="border-t border-surface-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Explain your approach or ask a question..."
            rows={2}
            className="flex-1 resize-none rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-accent"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
