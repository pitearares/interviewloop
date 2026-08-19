import { Link } from "react-router-dom";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-crimson text-white shadow-glow-crimson hover:brightness-110 active:brightness-95",
  ghost:
    "bg-surface-raised text-ink-bright shadow-hairline hover:bg-[rgba(186,214,247,0.11)]",
  outline:
    "bg-transparent text-ink-muted shadow-hairline hover:text-ink-bright hover:bg-surface-raised",
  danger:
    "bg-transparent text-ink-muted shadow-hairline hover:text-crimson hover:shadow-[inset_0_0_0_1px_rgba(252,28,70,0.32)]",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-sm",
};

function buttonClass(variant: ButtonVariant, size: ButtonSize, extra?: string): string {
  return [
    "inline-flex items-center justify-center gap-2 rounded-pill font-medium",
    "transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/60",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    extra ?? "",
  ].join(" ");
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "ghost",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

interface LinkButtonProps {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

export function LinkButton({
  to,
  variant = "ghost",
  size = "md",
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`glass rounded-card shadow-hairline ${className ?? ""}`}>{children}</div>
  );
}

/* ------------------------------------------------------------------ */
/* Typography                                                          */
/* ------------------------------------------------------------------ */

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`font-mono text-eyebrow uppercase text-ink-faint ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

/** Centered eyebrow flanked by fading hairlines — the section opener. */
export function SectionMark({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-5">
      <div className="rule-fade flex-1" />
      <Eyebrow>{children}</Eyebrow>
      <div className="rule-fade flex-1" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export type BadgeTone = "neutral" | "mint" | "amber" | "crimson" | "violet";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-raised text-ink-muted shadow-hairline",
  mint: "bg-mint-soft text-[#6fdcc6] shadow-[inset_0_0_0_1px_rgba(38,150,132,0.34)]",
  amber: "bg-amber-soft text-[#f09b7f] shadow-[inset_0_0_0_1px_rgba(228,109,76,0.34)]",
  crimson: "bg-crimson-soft text-[#ff6b87] shadow-[inset_0_0_0_1px_rgba(252,28,70,0.32)]",
  violet: "bg-violet-soft text-[#a68cff] shadow-[inset_0_0_0_1px_rgba(102,58,243,0.36)]",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.12em] ${BADGE_TONES[tone]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

export function StatBlock({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: BadgeTone;
}) {
  const valueTone: Record<BadgeTone, string> = {
    neutral: "text-ink-bright",
    mint: "text-[#6fdcc6]",
    amber: "text-[#f09b7f]",
    crimson: "text-[#ff6b87]",
    violet: "text-[#a68cff]",
  };

  return (
    <Card className="p-5">
      <Eyebrow>{label}</Eyebrow>
      <p
        className={`mt-3 font-display text-stat font-semibold tabular-nums ${valueTone[tone]}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-ghost">{hint}</p>}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-control bg-crimson-soft px-4 py-2.5 text-sm text-[#ff6b87] shadow-[inset_0_0_0_1px_rgba(252,28,70,0.32)]">
      {children}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-ink-faint">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-violet" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-violet" />
      </span>
      {label ?? "Loading..."}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared domain labels                                                */
/* ------------------------------------------------------------------ */

export const DIFFICULTY_TONE: Record<string, BadgeTone> = {
  EASY: "mint",
  MEDIUM: "amber",
  HARD: "crimson",
};

export const TOPIC_LABELS: Record<string, string> = {
  ARRAYS_STRINGS: "Arrays & Strings",
  ALGORITHMS: "Algorithms",
  DATA_STRUCTURES: "Data Structures",
  DYNAMIC_PROGRAMMING: "Dynamic Programming",
  LANGUAGE_FUNDAMENTALS: "Language Fundamentals",
  OOP: "OOP & Design",
  COLLECTIONS: "Collections",
  MEMORY_MANAGEMENT: "Memory Management",
};

export const TRACK_LABELS: Record<string, string> = {
  GENERAL: "General",
  JAVA: "Java",
  CPP: "C++",
};

export const VERDICT_TONE: Record<string, BadgeTone> = {
  STRONG_HIRE: "mint",
  HIRE: "violet",
  LEANING_NO: "amber",
  NO: "crimson",
};

export const VERDICT_LABELS: Record<string, string> = {
  STRONG_HIRE: "Strong Hire",
  HIRE: "Hire",
  LEANING_NO: "Leaning No",
  NO: "No",
};
