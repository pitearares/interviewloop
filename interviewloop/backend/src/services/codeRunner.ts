import vm from "node:vm";
import { spawn } from "node:child_process";

/**
 * Simple sandboxed code execution against a problem's example test cases.
 * This is intentionally not a full competitive-programming judge — just
 * enough to give the candidate real feedback in the interview screen,
 * with a hard timeout so a bad submission can't hang the server.
 */

export interface RunTestCase {
  input: unknown[];
  expected: unknown;
}

export interface TestCaseResult {
  input: unknown[];
  expected: unknown;
  actual: unknown;
  passed: boolean;
  error: string | null;
}

export interface RunResult {
  results: TestCaseResult[];
  allPassed: boolean;
  runtimeError: string | null;
}

const TIMEOUT_MS = 3000;

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Extracts the top-level function name from candidate code. Candidates are
 * given a `function name(...)` starter but often rewrite it in arrow-function
 * style — both are common in real interviews, so both are detected:
 *   function twoSum(nums, target) { ... }
 *   const twoSum = (nums, target) => { ... }
 *   const twoSum = function (nums, target) { ... }
 */
function findFunctionName(code: string): string | null {
  const decl = code.match(/function\s+([a-zA-Z_$][\w$]*)\s*\(/);
  if (decl) return decl[1];

  const assigned = code.match(
    /(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(?:function\s*\(|\(?[\w$,\s]*\)?\s*=>)/,
  );
  return assigned ? assigned[1] : null;
}

export async function runJavaScript(code: string, testCases: RunTestCase[]): Promise<RunResult> {
  const fnName = findFunctionName(code);
  if (!fnName) {
    return {
      results: [],
      allPassed: false,
      runtimeError: "Could not find a top-level function declaration to test.",
    };
  }

  const results: TestCaseResult[] = [];
  for (const tc of testCases) {
    const context: Record<string, unknown> = {};
    vm.createContext(context);
    try {
      const script = new vm.Script(
        `${code}\n;globalThis.__result = ${fnName}(...${JSON.stringify(tc.input)});`,
      );
      script.runInContext(context, { timeout: TIMEOUT_MS });
      const actual = context.__result;
      results.push({
        input: tc.input,
        expected: tc.expected,
        actual,
        passed: deepEqual(actual, tc.expected),
        error: null,
      });
    } catch (err) {
      results.push({
        input: tc.input,
        expected: tc.expected,
        actual: null,
        passed: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { results, allPassed: results.every((r) => r.passed), runtimeError: null };
}

function findPyFunctionName(code: string): string | null {
  const match = code.match(/def\s+([a-zA-Z_][\w]*)\s*\(/);
  return match ? match[1] : null;
}

export async function runPython(code: string, testCases: RunTestCase[]): Promise<RunResult> {
  const fnName = findPyFunctionName(code);
  if (!fnName) {
    return {
      results: [],
      allPassed: false,
      runtimeError: "Could not find a top-level function definition to test.",
    };
  }

  const driver = `
import json, sys

${code}

_cases = json.loads(sys.stdin.read())
_out = []
for _tc in _cases:
    try:
        _actual = ${fnName}(*_tc["input"])
        _out.append({"actual": _actual, "error": None})
    except Exception as e:
        _out.append({"actual": None, "error": str(e)})
print(json.dumps(_out))
`;

  return runPythonDriver(driver, testCases);
}

/** Runs the driver script with one interpreter command; resolves null on ENOENT so the caller can try the next candidate. */
function trySpawn(
  command: string,
  driver: string,
  testCases: RunTestCase[],
): Promise<RunResult | null> {
  return new Promise((resolve) => {
    const child = spawn(command, ["-c", driver], { stdio: ["pipe", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      child.kill("SIGKILL");
      resolve({
        results: [],
        allPassed: false,
        runtimeError: `Execution timed out after ${TIMEOUT_MS / 1000}s.`,
      });
    }, TIMEOUT_MS);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err: NodeJS.ErrnoException) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // ENOENT means this interpreter command isn't installed — let the
      // caller try the next candidate rather than reporting a hard failure.
      resolve(err.code === "ENOENT" ? null : { results: [], allPassed: false, runtimeError: err.message });
    });

    child.on("close", (exitCode) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (exitCode !== 0) {
        resolve({
          results: [],
          allPassed: false,
          runtimeError: stderr.trim() || `Python process exited with code ${exitCode}`,
        });
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as { actual: unknown; error: string | null }[];
        const results: TestCaseResult[] = testCases.map((tc, i) => ({
          input: tc.input,
          expected: tc.expected,
          actual: parsed[i]?.actual ?? null,
          passed: parsed[i]?.error == null && deepEqual(parsed[i]?.actual, tc.expected),
          error: parsed[i]?.error ?? null,
        }));
        resolve({ results, allPassed: results.every((r) => r.passed), runtimeError: null });
      } catch {
        resolve({ results: [], allPassed: false, runtimeError: "Failed to parse Python output." });
      }
    });

    child.stdin.write(JSON.stringify(testCases.map((tc) => ({ input: tc.input }))));
    child.stdin.end();
  });
}

/** Different platforms expose the Python 3 interpreter under different names. */
const PYTHON_COMMANDS = ["python3", "python"];

async function runPythonDriver(driver: string, testCases: RunTestCase[]): Promise<RunResult> {
  for (const command of PYTHON_COMMANDS) {
    const result = await trySpawn(command, driver, testCases);
    if (result !== null) return result;
  }
  return {
    results: [],
    allPassed: false,
    runtimeError: "Python runtime is not available in this environment.",
  };
}

export async function runCode(
  language: string,
  code: string,
  testCases: RunTestCase[],
): Promise<RunResult> {
  if (language === "python") {
    return runPython(code, testCases);
  }
  if (language === "java" || language === "cpp") {
    // No JDK / C++ toolchain in this environment. The interviewer still
    // watches the code live and the evaluator grades it by reading — only
    // automated test execution is unavailable.
    return {
      results: [],
      allPassed: false,
      runtimeError:
        `Automated ${language === "java" ? "Java" : "C++"} execution isn't available in this environment. ` +
        "Your interviewer reviews the code as you write it, and the final evaluation grades it by reading — keep going.",
    };
  }
  return runJavaScript(code, testCases);
}
