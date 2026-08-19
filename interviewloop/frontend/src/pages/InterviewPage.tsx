import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useInterviewSocket } from "../lib/useInterviewSocket";
import type { InterviewSessionDetail, RunResult } from "../lib/types";
import { ProblemPanel } from "../components/ProblemPanel";
import { CodeEditor, type EditorLanguage } from "../components/CodeEditor";
import { InterviewerPanel } from "../components/InterviewerPanel";
import { Timer } from "../components/Timer";
import { RunResultsPanel } from "../components/RunResultsPanel";
import { Logo } from "../components/SiteNav";
import { Button, Spinner } from "../components/ui";

const CODE_UPDATE_DEBOUNCE_MS = 800;

function normalizeLanguage(raw: string): EditorLanguage {
  if (raw === "python" || raw === "java" || raw === "cpp") return raw;
  return "javascript";
}

function starterFor(session: InterviewSessionDetail, lang: EditorLanguage): string {
  switch (lang) {
    case "python":
      return session.problem.starterCodePy;
    case "java":
      return session.problem.starterCodeJava;
    case "cpp":
      return session.problem.starterCodeCpp;
    default:
      return session.problem.starterCodeJs;
  }
}

function EndConfirm({
  onCancel,
  onConfirm,
  ending,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  ending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,6,15,0.8)] p-6 backdrop-blur-sm">
      <div className="glass-solid w-full max-w-md rounded-card p-8">
        <h2 className="font-display text-2xl font-bold uppercase text-ink-bright">
          End the interview?
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-ink-faint">
          Your final code is saved and your interviewer writes the debrief. You can't return to
          this room afterwards.
        </p>
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={ending}>
            Keep going
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={ending}>
            {ending ? "Wrapping up..." : "End & get debrief"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<InterviewSessionDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [language, setLanguage] = useState<EditorLanguage>("javascript");
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [ending, setEnding] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const { messages, thinking, sendCode, sendCandidateMessage, endSession } =
    useInterviewSocket(sessionId);

  const codeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!sessionId) return;
    api
      .getSession(sessionId)
      .then((s) => {
        setSession(s);
        const lang = normalizeLanguage(s.language);
        setLanguage(lang);
        setCode(starterFor(s, lang));
        startedAtRef.current = new Date(s.startedAt).getTime();
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load session"));
  }, [sessionId]);

  function handleCodeChange(next: string) {
    setCode(next);
    if (codeDebounceRef.current) clearTimeout(codeDebounceRef.current);
    codeDebounceRef.current = setTimeout(() => sendCode(next), CODE_UPDATE_DEBOUNCE_MS);
  }

  function handleLanguageChange(next: "javascript" | "python") {
    if (!session) return;
    setLanguage(next);
    setCode(starterFor(session, next));
    setRunResult(null);
  }

  async function handleRun() {
    if (!session) return;
    setRunning(true);
    setRunResult(null);
    try {
      const result = await api.runCode(session.problem.id, language, code);
      setRunResult(result);
    } catch (err) {
      setRunResult({
        results: [],
        allPassed: false,
        runtimeError: err instanceof Error ? err.message : "Failed to run code",
      });
    } finally {
      setRunning(false);
    }
  }

  async function handleEndInterview() {
    if (!sessionId || ending) return;
    setEnding(true);
    // Wait for the server's ack — it guarantees the final code snapshot is
    // persisted and the session marked COMPLETED before we navigate, so the
    // evaluation report is generated from the candidate's actual last state.
    await endSession();
    navigate(`/evaluation/${sessionId}`);
  }

  if (loadError) {
    return (
      <div className="atmosphere flex h-full items-center justify-center px-6">
        <p className="text-sm text-[#ff6b87]">{loadError}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="atmosphere flex h-full items-center justify-center px-6">
        <Spinner label="Opening the interview room..." />
      </div>
    );
  }

  const isTheory = session.problem.kind === "THEORY";
  /** Java/C++ code can't be auto-executed here — the interviewer reviews it instead. */
  const canRun = language === "javascript" || language === "python";

  return (
    <div className="flex h-full flex-col bg-void">
      <header className="flex shrink-0 items-center justify-between border-b border-surface-border bg-[rgba(5,6,15,0.8)] px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Logo compact />
          <div className="h-4 w-px bg-surface-border" />
          <h1 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-bright">
            {session.problem.title}
          </h1>
          {isTheory && (
            <span className="rounded-pill bg-violet-soft px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[#a68cff] shadow-[inset_0_0_0_1px_rgba(102,58,243,0.36)]">
              Oral interview
            </span>
          )}
          <Timer startedAt={startedAtRef.current} />
        </div>

        <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
          End interview
        </Button>
      </header>

      {isTheory ? (
        /* Oral interview: no editor — the conversation is the whole session. */
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(320px,1.1fr)_minmax(480px,2fr)]">
          <div className="min-h-0 border-r border-surface-border">
            <ProblemPanel problem={session.problem} />
          </div>
          <div className="min-h-0">
            <InterviewerPanel
              messages={messages}
              thinking={thinking}
              onSend={sendCandidateMessage}
            />
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(300px,1fr)_minmax(440px,1.7fr)_minmax(320px,1fr)]">
          <div className="min-h-0 border-r border-surface-border">
            <ProblemPanel problem={session.problem} />
          </div>

          <div className="flex min-h-0 flex-col border-r border-surface-border">
            <div className="min-h-0 flex-1">
              <CodeEditor
                language={language}
                code={code}
                onChange={handleCodeChange}
                onLanguageChange={canRun ? handleLanguageChange : undefined}
              />
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-surface-border px-5 py-3">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-ghost">
                {code.split("\n").length} lines
              </span>
              {canRun ? (
                <Button variant="primary" size="sm" onClick={handleRun} disabled={running}>
                  {running ? "Running..." : "Run code"}
                </Button>
              ) : (
                <span
                  className="text-xs text-ink-ghost"
                  title="No Java/C++ toolchain in this environment — the interviewer reviews your code as you write it."
                >
                  Reviewed by your interviewer
                </span>
              )}
            </div>

            {runResult && <RunResultsPanel result={runResult} />}
          </div>

          <div className="min-h-0">
            <InterviewerPanel
              messages={messages}
              thinking={thinking}
              onSend={sendCandidateMessage}
            />
          </div>
        </div>
      )}

      {confirming && (
        <EndConfirm
          ending={ending}
          onCancel={() => setConfirming(false)}
          onConfirm={handleEndInterview}
        />
      )}
    </div>
  );
}
