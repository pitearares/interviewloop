import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Logo } from "../components/SiteNav";
import { Button, ErrorNote, Eyebrow } from "../components/ui";

type Mode = "login" | "register";

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <Eyebrow>{label}</Eyebrow>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-control bg-surface-raised px-3.5 py-2.5 text-sm text-ink-bright shadow-hairline outline-none transition-shadow placeholder:text-ink-ghost focus:shadow-[inset_0_0_0_1px_rgba(102,58,243,0.5)]"
      />
    </label>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/practice";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const user =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(email, name, password);
      setUser(user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  return (
    <div className="atmosphere flex min-h-full flex-col">
      <header className="flex h-16 items-center px-6">
        <Logo />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-md">
          <div className="text-center">
            <Eyebrow className="text-crimson">
              {mode === "login" ? "Welcome back" : "Join the loop"}
            </Eyebrow>
            <h1 className="mt-4 font-display text-display-md font-bold uppercase text-ink-bright">
              {mode === "login" ? "Sign in" : "Create account"}
            </h1>
          </div>

          {/* Mode toggle */}
          <div className="mx-auto mt-8 flex w-fit rounded-pill bg-surface-raised p-1 shadow-hairline">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`rounded-pill px-5 py-1.5 text-xs font-medium transition-all ${
                  mode === m
                    ? "bg-crimson text-white shadow-glow-crimson"
                    : "text-ink-faint hover:text-ink-bright"
                }`}
              >
                {m === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="glass mt-6 space-y-5 rounded-card p-8 shadow-lift">
            {mode === "register" && (
              <Field
                label="Name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Ada Lovelace"
                autoComplete="name"
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />

            {error && <ErrorNote>{error}</ErrorNote>}

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
              {busy
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </Button>

            <p className="text-center text-xs text-ink-ghost">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="text-ink-muted underline-offset-2 hover:text-ink-bright hover:underline"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-ink-muted underline-offset-2 hover:text-ink-bright hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>

          <p className="mt-6 text-center text-xs text-ink-ghost">
            <Link to="/" className="hover:text-ink-muted">
              ← Back to the homepage
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
