import { useEffect, useState } from "react";

function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Timer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedSec = Math.max(0, Math.floor((now - startedAt) / 1000));

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface-raised px-2.5 py-1 font-mono text-xs text-ink-muted">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6.25" />
        <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {formatDuration(elapsedSec)}
    </div>
  );
}
