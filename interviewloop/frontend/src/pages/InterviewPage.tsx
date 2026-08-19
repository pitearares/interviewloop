import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useInterviewSocket } from "../lib/useInterviewSocket";
import type { InterviewSessionDetail, RunResult } from "../lib/types";
import { ProblemPanel } from "../components/ProblemPanel";
import { CodeEditor } from "../components/CodeEditor";
import { InterviewerPanel } from "../components/InterviewerPanel";
import { Timer } from "../components/Timer";
import { RunResultsPanel } from "../components/RunResultsPanel";

const CODE_UPDATE_DEBOUNCE_MS = 800;

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<InterviewSessionDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [language, setLanguage] = useState<"javascript" | "python">("javascript");
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [ending, setEnding] = useState(false);

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
        setLanguage(s.language === "python" ? "python" : "javascript");
        setCode(s.language === "python" ? s.problem.starterCodePy : s.problem.starterCodeJs);
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
    setCode(next === "python" ? session.problem.starterCodePy : session.problem.starterCodeJs);
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

  const editorLanguage = useMemo(() => language, [language]);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-300">{loadError}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-ink-faint">Loading interview...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-surface-border bg-surface-panel px-5 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-ink">{session.problem.title}</h1>
          <Timer startedAt={startedAtRef.current} />
        </div>
        <button
          onClick={handleEndInterview}
          disabled={ending}
          className="rounded-lg border border-surface-border px-3.5 py-1.5 text-sm text-ink-muted transition-colors hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
        >
          {ending ? "Ending..." : "End Interview"}
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(280px,1fr)_minmax(420px,1.6fr)_minmax(300px,1fr)]">
        <div className="min-h-0 border-r border-surface-border bg-surface-panel">
          <ProblemPanel problem={session.problem} />
        </div>

        <div className="flex min-h-0 flex-col border-r border-surface-border">
          <div className="min-h-0 flex-1">
            <CodeEditor
              language={editorLanguage}
              code={code}
              onChange={handleCodeChange}
              onLanguageChange={handleLanguageChange}
            />
          </div>
          <div className="flex items-center justify-end border-t border-surface-border bg-surface-raised px-4 py-2.5">
            <button
              onClick={handleRun}
              disabled={running}
              className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? "Running..." : "Run code"}
            </button>
          </div>
          {runResult && <RunResultsPanel result={runResult} />}
        </div>

        <div className="min-h-0 bg-surface-panel">
          <InterviewerPanel messages={messages} thinking={thinking} onSend={sendCandidateMessage} />
        </div>
      </div>
    </div>
  );
}
