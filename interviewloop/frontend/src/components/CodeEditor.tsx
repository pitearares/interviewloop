import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";

export type EditorLanguage = "javascript" | "python" | "java" | "cpp";

interface CodeEditorProps {
  language: EditorLanguage;
  code: string;
  onChange: (code: string) => void;
  /** Present only when the language is switchable (the General track). */
  onLanguageChange?: (language: "javascript" | "python") => void;
}

const LANGUAGE_LABELS: Record<EditorLanguage, string> = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
};

/** Monaco's language ids for each supported language. */
const MONACO_LANGUAGE: Record<EditorLanguage, string> = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
};

/** Monaco theme matched to the midnight canvas. */
const THEME_NAME = "interviewloop-midnight";

const THEME: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "5a6478", fontStyle: "italic" },
    { token: "keyword", foreground: "a68cff" },
    { token: "string", foreground: "6fdcc6" },
    { token: "number", foreground: "f09b7f" },
    { token: "type", foreground: "98c0ef" },
  ],
  colors: {
    "editor.background": "#080a14",
    "editor.foreground": "#d1e4fa",
    "editorLineNumber.foreground": "#3a4256",
    "editorLineNumber.activeForeground": "#9da7ba",
    "editor.lineHighlightBackground": "#bad6f70a",
    "editor.selectionBackground": "#663af344",
    "editorCursor.foreground": "#fc1c46",
    "editorIndentGuide.background1": "#bad6f712",
    "editorIndentGuide.activeBackground1": "#bad6f728",
  },
};

export function CodeEditor({ language, code, onChange, onLanguageChange }: CodeEditorProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-surface-border px-5 py-2.5">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-ghost">
          Editor
        </span>
        {onLanguageChange ? (
          <div className="flex gap-1.5">
            {(["javascript", "python"] as const).map((value) => (
              <button
                key={value}
                onClick={() => onLanguageChange(value)}
                className={`rounded-pill px-3 py-1 text-xs font-medium transition-all ${
                  language === value
                    ? "bg-surface-raised text-ink-bright shadow-hairline"
                    : "text-ink-ghost hover:text-ink-muted"
                }`}
              >
                {LANGUAGE_LABELS[value]}
              </button>
            ))}
          </div>
        ) : (
          <span className="rounded-pill bg-surface-raised px-3 py-1 text-xs font-medium text-ink-bright shadow-hairline">
            {LANGUAGE_LABELS[language]}
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={MONACO_LANGUAGE[language]}
          value={code}
          theme={THEME_NAME}
          beforeMount={(monaco) => monaco.editor.defineTheme(THEME_NAME, THEME)}
          onChange={(value) => onChange(value ?? "")}
          options={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 13.5,
            lineHeight: 1.7,
            minimap: { enabled: false },
            padding: { top: 20, bottom: 20 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            renderLineHighlight: "line",
            smoothScrolling: true,
            cursorBlinking: "smooth",
          }}
        />
      </div>
    </div>
  );
}
