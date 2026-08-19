import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  language: "javascript" | "python";
  code: string;
  onChange: (code: string) => void;
  onLanguageChange: (language: "javascript" | "python") => void;
}

const LANGUAGE_LABELS: Record<CodeEditorProps["language"], string> = {
  javascript: "JavaScript",
  python: "Python",
};

export function CodeEditor({ language, code, onChange, onLanguageChange }: CodeEditorProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-surface-border bg-surface-raised px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">Editor</span>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as CodeEditorProps["language"])}
          className="rounded-md border border-surface-border bg-surface px-2 py-1 font-mono text-xs text-ink outline-none focus:border-accent"
        >
          {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={(value) => onChange(value ?? "")}
          options={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 14,
            minimap: { enabled: false },
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
