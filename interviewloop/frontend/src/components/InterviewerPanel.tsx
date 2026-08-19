import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../lib/types";
import { Eyebrow } from "./ui";

interface InterviewerPanelProps {
  messages: ChatMessage[];
  thinking: boolean;
  onSend: (text: string) => void;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isCandidate = message.role === "candidate";
  const isNudge = message.kind === "INTERVIEWER_NUDGE";

  return (
    <div
      className={`flex animate-message-in flex-col gap-1.5 ${isCandidate ? "items-end" : "items-start"}`}
    >
      {isNudge && (
        <span className="px-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#f09b7f]">
          Nudge
        </span>
      )}
      <div
        className={`max-w-[88%] rounded-card px-4 py-3 text-sm leading-relaxed ${
          isCandidate
            ? "rounded-tr-md bg-violet-soft text-ink shadow-[inset_0_0_0_1px_rgba(102,58,243,0.36)]"
            : isNudge
              ? "rounded-tl-md bg-amber-soft text-ink shadow-[inset_0_0_0_1px_rgba(228,109,76,0.34)]"
              : "rounded-tl-md bg-surface-raised text-ink shadow-hairline"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex animate-message-in items-start">
      <div className="flex items-center gap-1.5 rounded-card rounded-tl-md bg-surface-raised px-4 py-3.5 shadow-hairline">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-ghost [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-ghost [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-ghost" />
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
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-surface-border px-5 py-4">
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full rounded-full bg-violet ${thinking ? "animate-pulse-ring" : ""}`}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-violet" />
        </span>
        <span className="text-sm font-medium text-ink-bright">Interviewer</span>
        {thinking && (
          <span className="ml-auto font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-ghost">
            Thinking
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 && !thinking && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Eyebrow>Standing by</Eyebrow>
            <p className="text-sm text-ink-ghost">Your interviewer will join shortly.</p>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {thinking && <TypingIndicator />}
      </div>

      <div className="border-t border-surface-border p-4">
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
          rows={3}
          className="w-full resize-none rounded-control bg-surface-raised px-3.5 py-3 text-sm leading-relaxed text-ink-bright shadow-hairline outline-none transition-shadow placeholder:text-ink-ghost focus:shadow-[inset_0_0_0_1px_rgba(102,58,243,0.5)]"
        />
        <div className="mt-2.5 flex items-center justify-between">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-ghost">
            Enter to send
          </span>
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="inline-flex h-8 items-center rounded-pill bg-crimson px-4 text-xs font-medium text-white shadow-glow-crimson transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
