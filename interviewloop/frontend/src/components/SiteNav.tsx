import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { LinkButton } from "./ui";

const LINKS = [
  { to: "/practice", label: "Practice" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/history", label: "History" },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-crimson" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-crimson shadow-glow-crimson" />
      </span>
      {!compact && (
        <span className="font-display text-sm font-bold uppercase tracking-[0.16em] text-ink-bright">
          Interview<span className="text-ink-faint">Loop</span>
        </span>
      )}
    </Link>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (user === undefined) return null; // cookie check in flight

  if (user === null) {
    return (
      <div className="flex items-center gap-2">
        <LinkButton to="/login" variant="outline" size="sm">
          Sign in
        </LinkButton>
        <LinkButton to="/practice" variant="primary" size="sm">
          Start interview
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden items-center gap-2 sm:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-violet-soft font-mono text-[0.65rem] uppercase text-[#a68cff] shadow-[inset_0_0_0_1px_rgba(102,58,243,0.36)]">
          {user.name.slice(0, 1)}
        </span>
        <span className="text-sm text-ink-muted">{user.name}</span>
      </span>
      <button
        onClick={() => void signOut().then(() => navigate("/"))}
        className="rounded-pill px-3 py-1.5 text-xs text-ink-faint shadow-hairline transition-colors hover:text-ink-bright"
      >
        Sign out
      </button>
      <LinkButton to="/practice" variant="primary" size="sm">
        Start interview
      </LinkButton>
    </div>
  );
}

export function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-surface-border bg-[rgba(5,6,15,0.72)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-pill px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-surface-raised text-ink-bright shadow-hairline"
                    : "text-ink-faint hover:text-ink-bright"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <UserMenu />
      </div>
    </header>
  );
}

/** Page wrapper for all marketing + app-chrome pages. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="atmosphere min-h-full">
      <SiteNav />
      {children}
      <footer className="mx-auto mt-24 max-w-[1280px] px-6 pb-10">
        <div className="rule-fade mb-6" />
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-ink-ghost sm:flex-row">
          <span>InterviewLoop — adaptive interview practice.</span>
          <span className="font-mono uppercase tracking-[0.14em]">Built for the loop</span>
        </div>
      </footer>
    </div>
  );
}
