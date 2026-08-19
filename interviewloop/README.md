# InterviewLoop

An AI-powered technical interview simulator. Pick a coding problem, write code in a live Monaco editor, and an AI interviewer watches your progress in real time — asking adaptive follow-up questions, nudging you when stuck, and delivering a structured evaluation at the end.

> **Status:** All five build phases complete. See "Build phases" below.

## Project description (for CV / portfolio)

InterviewLoop is a full-stack technical interview simulator that pairs a live code editor with an LLM-driven interviewer. Rather than a generic chatbot, the interviewer runs an explicit decision loop — deciding whether to stay silent, ask a follow-up, nudge a stuck candidate, or request an explanation — based on session state (code history, elapsed time, prior Q&A). Built with React, TypeScript, Express, Socket.io, Prisma, and the Claude API.

## Tech stack

- **Frontend:** React + TypeScript + Vite, Monaco Editor, Tailwind CSS
- **Backend:** Node.js + Express + TypeScript, Socket.io
- **Database:** SQLite via Prisma
- **AI:** Anthropic API (`claude-sonnet-5`)

## Project structure

```
interviewloop/
  frontend/   React app (Vite)
  backend/    Express API + Socket.io + Prisma
```

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env      # fill in ANTHROPIC_API_KEY
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev                # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:4000`.

**Python support (optional):** the "Run code" button executes Python solutions via a `python3`/`python` subprocess with a 3s timeout. If neither is on `PATH`, Python submissions return a clear "Python runtime is not available" message instead of failing silently — JavaScript, sandboxed via Node's `vm` module, always works with no extra setup.

## Environment variables

| Variable | Where | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | `backend/.env` | Anthropic API key used for all interviewer/evaluation calls |
| `DATABASE_URL` | `backend/.env` | SQLite connection string, defaults to `file:./dev.db` |
| `PORT` | `backend/.env` | Backend HTTP port, defaults to `4000` |
| `FRONTEND_URL` | `backend/.env` | Origin allowed for Socket.io CORS, defaults to `http://localhost:5173` |

## Build phases

This project is being built in five phases:

1. **Scaffolding & boilerplate** — project structure, Prisma schema + seed, empty pages, dev servers running end-to-end. *(done)*
2. **Adaptive interviewer decision logic** — the core silent/question/nudge/explain decision loop. *(done)*
3. **UI & standard components** — Monaco integration, three-pane layout, interviewer panel, history list. *(done)*
4. **Final evaluation report generator** — transcript synthesis into a structured report + report screen. *(done)*
5. **Debugging & polish** — end-to-end pass, sandboxed execution hardening, this README's design-decision writeup. *(done)*

## Adaptive interviewer decision logic

The core design problem: a live interviewer that reacts to code as it's written, without calling an LLM on every keystroke (expensive, slow) and without feeling scripted (a timer that fires a canned hint every 2 minutes). The solution is a **two-layer decision loop**, deliberately split so each layer does what it's good at:

### Layer 1 — a deterministic gate (`backend/src/services/interviewer.ts` → `applyGate`)

A pure function that decides *whether the model should even be consulted* for a given tick. It sees a `SessionSnapshot` (elapsed time, seconds since last keystroke, intervention count, cooldowns) and returns `{consult, reason}`. The rules are ordinary `if` statements you can read in one sitting:

- **Warmup:** no commentary in the first 60s — let the candidate read the problem.
- **Cooldowns:** never speak within 60s of the interviewer's last message, or 15s of the candidate's.
- **Budget:** at most 6 unprompted interventions per session ("stuck" rescues may exceed it).
- **Blank editor:** silence while they think; check in only after 2 minutes of nothing.
- **No-movement periodic ticks are skipped** — the dedicated "stuck" trigger covers stalls, so the periodic tick doesn't double-fire.

Because this layer is deterministic, most ticks cost zero tokens, the behavior is unit-testable (`npm run exercise` replays a scripted timeline through it), and "why did the interviewer interrupt me?" always has a loggable answer.

### Layer 2 — one model call that picks the action

Only when the gate passes does the backend call Claude (`claude-sonnet-5`) with a decision rubric and the session snapshot. The model returns structured JSON — `{action: silent | ask_question | nudge | ask_explain, message}` — enforced by a JSON schema via the API's structured-output support, so a malformed response can never leak into the chat (parse failures degrade to `silent`). Crucially, the model may still answer `silent`: the gate only has to be roughly right about *when to look*, the model decides *whether speaking is actually warranted*.

### Cost & latency choices

- **Debounced triggers, never keystrokes:** code evaluation fires 30s after the last keystroke ("pause"), 75s of total inactivity ("stuck"), or a 90s periodic tick — all funneled through the gate.
- **Prompt caching:** the persona + rubric + problem statement are static per session, so they live in a single system block with a `cache_control` breakpoint; each subsequent call re-reads them from cache instead of re-paying for them.
- **Low effort setting:** interviewer calls run with `effort: "low"` — the rubric does the heavy lifting, and side-panel latency matters more than deep reasoning.
- **Serialized, never dropped:** every model-invoking operation (a gated evaluation, a reply to the candidate) is appended to a per-session promise queue instead of guarded by a boolean flag. Concurrent triggers run one after another rather than colliding — and critically, a candidate message that arrives while an evaluation is in flight is *queued*, not silently skipped, so a question is always answered.

Chat messages from the candidate bypass the gate entirely — a question always deserves an answer (`respondToCandidate`).

## Evaluation report generator

At the end of a session, `backend/src/services/evaluator.ts` synthesizes everything the interviewer saw into one structured report:

- **The full timestamped transcript** — every question, nudge, and candidate reply, in order. Code snapshots are thinned to at most 5 (first, last, and evenly-spaced middles) so a long session's prompt doesn't balloon with near-duplicate code.
- **A real test run of the final code**, executed through the same sandboxed runner behind "Run code" — so "correctness" in the report is grounded in actual pass/fail results, not a guess.
- One model call returns schema-enforced JSON (`verdict`, `correctness`, `communication`, `codeQuality`, `advice[]`), persisted once and returned unchanged on any later request — generating a report twice never re-runs the model or double-charges an API call.

The frontend (`EvaluationPage.tsx`) shows a brief "writing up the debrief" state while this runs, then staggers the report sections in with a short entrance animation.

## Phase 5 — bugs found and fixed

A dedicated debugging pass over the whole stack turned up several real issues (verified with direct socket clients, `curl`, and a headless-browser walkthrough — not just re-reading the code):

- **Invalid JSON schema.** The interviewer's decision schema declared `message` as `type: ["string", "null"]` — an array-valued `type`, which the API's structured-output subset doesn't support (only `anyOf` does). Every decision call would have failed. Fixed to `anyOf: [{type: "string"}, {type: "null"}]`.
- **Double greeting on rapid rejoin.** `sessionManager.start()` checked `live.has(sessionId)` before an `await`, so two `session:join` events arriving close together (a flaky reconnect, a double-mount) could both pass the check and spin up two competing session loops. Fixed with a synchronous claim set (`starting`) held for the duration of the async setup.
- **Candidate messages silently dropped.** If a candidate sent a chat message while a periodic/pause evaluation was already mid-call, the old code just returned early — the message was persisted but never answered. Replaced the boolean "evaluating" guard with a proper per-session work queue (see above) so replies are always sent, just possibly delayed behind other queued work.
- **JS solutions in arrow-function style went undetected.** The code runner only recognized `function name(...) {}`; a candidate writing `const twoSum = (nums, target) => {...}` (extremely common in real interviews) got "could not find a function to test" on correct code. Extended the detector to cover arrow functions and function expressions assigned to `const`/`let`/`var`.
- **Python execution assumed `python3` exists.** On Windows (and some Linux setups) only `python` is on `PATH`. The runner now tries `python3` then `python`, and only reports "not available" if neither resolves.
- **Evaluation could read a stale final snapshot.** "End Interview" fired `session:end` and navigated after a guessed 400ms delay — on a slow request, the evaluator could run before the last code snapshot was persisted. Added a socket acknowledgement: the server confirms the snapshot is saved and the session is `COMPLETED` before firing the callback, and the frontend now awaits it instead of guessing.
- **CORS mismatch.** Socket.io was already origin-restricted to `FRONTEND_URL`; the REST API's `cors()` call was wide open. Aligned both to the same origin.
