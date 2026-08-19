# InterviewLoop

An AI-powered technical interview simulator. Pick a track and a problem, write code in a live Monaco editor — or answer questions in an oral interview — and an AI interviewer watches your progress in real time, asking adaptive follow-up questions, nudging you when stuck, and delivering a structured evaluation at the end.

## Project description (for CV / portfolio)

InterviewLoop is a full-stack technical interview simulator that pairs a live code editor with an LLM-driven interviewer. Rather than a generic chatbot, the interviewer runs an explicit decision loop — deciding whether to stay silent, ask a follow-up, nudge a stuck candidate, or request an explanation — based on session state (code history, elapsed time, prior Q&A). It supports both **coding interviews** (live editor, sandboxed test execution) and **oral knowledge interviews** (question banks per language track), with account-based progress tracking and a statistics dashboard. Built with React, TypeScript, Express, Socket.io, Prisma, PostgreSQL, and the Google Gemini API.

## Tech stack

- **Frontend:** React + TypeScript + Vite, Monaco Editor, Tailwind CSS, React Router
- **Backend:** Node.js + Express + TypeScript, Socket.io
- **Database:** PostgreSQL via Prisma (hosted on [Neon](https://neon.tech))
- **AI:** Google Gemini API (`gemini-3.6-flash`)
- **Auth:** session cookies + scrypt password hashing (no external dependencies)

## Features

- **Three interview tracks** — General (algorithms in JS/Python), Java, and C++
- **Two interview modes** — live coding sessions and oral theory interviews driven by a question bank
- **Adaptive interviewer** — a deterministic gate decides *when* to speak; the model decides *what* to say (see below)
- **Sandboxed code execution** — run your solution against real test cases from the editor
- **Structured debrief** — verdict, correctness, communication, and code-quality assessments plus concrete advice
- **Accounts & progress tracking** — register/sign in, with per-user history and a statistics dashboard (positive rate, day streak, verdict distribution, strength by topic, verdict trend)

## Project structure

```
interviewloop/
  frontend/   React app (Vite)
    src/pages/       Landing, Login, Practice, Interview, Evaluation, History, Dashboard
    src/components/  UI primitives, editor, interviewer panel, problem panel
  backend/    Express API + Socket.io + Prisma
    src/routes/      auth, problems, sessions, run, stats
    src/services/    interviewer, evaluator, sessionManager, codeRunner, auth
```

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL and GEMINI_API_KEY
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev                # http://localhost:4000
```

`DATABASE_URL` expects a PostgreSQL connection string. A free [Neon](https://neon.tech) database works out of the box — keep the `?sslmode=require` suffix.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:4000`.

### Language runtime support

The "Run code" button executes submissions against the problem's example test cases:

| Language | Execution | Notes |
|---|---|---|
| JavaScript | ✅ Sandboxed via Node's `vm` module | Works with no extra setup |
| Python | ✅ `python3`/`python` subprocess, 3s timeout | Falls back with a clear message if neither is on `PATH` |
| Java / C++ | ❌ Not executed | No JDK/toolchain assumed; the interviewer reviews the code live and the final evaluation grades it by reading |

## Environment variables

| Variable | Where | Description |
|---|---|---|
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string (e.g. from Neon) |
| `GEMINI_API_KEY` | `backend/.env` | Google Gemini API key used for all interviewer/evaluation calls |
| `PORT` | `backend/.env` | Backend HTTP port, defaults to `4000` |
| `FRONTEND_URL` | `backend/.env` | Origin allowed for CORS and Socket.io, defaults to `http://localhost:5173` |

## Interview tracks and modes

Problems carry two classifying fields: a **track** (`GENERAL`, `JAVA`, `CPP`) and a **kind** (`CODING` or `THEORY`).

**Coding sessions** use the three-pane layout — problem, editor, interviewer — with the editor's language fixed by the track (Java/C++) or selectable (General).

**Oral sessions** (`THEORY`) drop the editor entirely: the layout becomes the problem brief plus a full-height conversation. The problem's `prompt` holds a question bank, and the interviewer works through it one question at a time, reacting briefly to each answer and following up where an answer is thin. The interviewer runs on a separate persona, the gate skips its editor-based rules, and the evaluator grades answer accuracy rather than code.

Adding a track means seeding problems with a new `track` value in `backend/prisma/seed.ts` and registering it in `TRACKS` (`frontend/src/pages/ProblemSelectPage.tsx`) — filters, topics, the interview room, and evaluation all follow automatically.

## Authentication

Accounts are handled without any external auth dependency:

- Passwords are hashed with Node's built-in **scrypt** (random 16-byte salt, stored `salt:hash`), verified with `timingSafeEqual`.
- Login issues an **opaque 32-byte token** persisted in an `AuthSession` row and delivered as an `httpOnly`, `SameSite=Lax` cookie. Because sessions live server-side, signing out genuinely revokes access rather than just dropping a client-side token.
- `attachUser` resolves the cookie on every request without rejecting; `requireUser` gates the routes that need an account. Failed auth resolution never takes the API down.
- Login failures return one generic message for both unknown emails and wrong passwords, so the endpoint doesn't leak which addresses have accounts.

Interview sessions are scoped to their owner: history, statistics, and session detail all filter by user, and cross-user access returns 404 rather than 403 (no existence leak).

## Adaptive interviewer decision logic

The core design problem: a live interviewer that reacts to code as it's written, without calling an LLM on every keystroke (expensive, slow) and without feeling scripted (a timer that fires a canned hint every 2 minutes). The solution is a **two-layer decision loop**, deliberately split so each layer does what it's good at:

### Layer 1 — a deterministic gate (`backend/src/services/interviewer.ts` → `applyGate`)

A pure function that decides *whether the model should even be consulted* for a given tick. It sees a `SessionSnapshot` (elapsed time, seconds since last keystroke, intervention count, cooldowns) and returns `{consult, reason}`. The rules are ordinary `if` statements you can read in one sitting:

- **Warmup:** no commentary in the first 60s — let the candidate read the problem.
- **Cooldowns:** never speak within 60s of the interviewer's last message, or 15s of the candidate's.
- **Budget:** at most 6 unprompted interventions per session ("stuck" rescues may exceed it).
- **Blank editor:** silence while they think; check in only after 2 minutes of nothing.
- **No-movement periodic ticks are skipped** — the dedicated "stuck" trigger covers stalls, so the periodic tick doesn't double-fire.
- **Oral interviews** skip the editor-based rules entirely: past the cooldowns, a quiet candidate should be re-engaged, because the interviewer drives a theory session rather than the editor.

Because this layer is deterministic, most ticks cost zero tokens, the behavior is unit-testable (`npm run exercise` replays a scripted timeline through it), and "why did the interviewer interrupt me?" always has a loggable answer.

### Layer 2 — one model call that picks the action

Only when the gate passes does the backend call the model with a decision rubric and the session snapshot. It returns structured JSON — `{action: silent | ask_question | nudge | ask_explain, message}` — enforced by a response schema, so a malformed response can never leak into the chat (parse failures degrade to `silent`). Crucially, the model may still answer `silent`: the gate only has to be roughly right about *when to look*, the model decides *whether speaking is actually warranted*.

### Cost & latency choices

- **Debounced triggers, never keystrokes:** code evaluation fires 30s after the last keystroke ("pause"), 75s of total inactivity ("stuck"), or a 90s periodic tick — all funneled through the gate.
- **Static prompt block:** the persona + rubric + problem statement are constant per session and live in a single system instruction, kept separate from the changing state message.
- **Serialized, never dropped:** every model-invoking operation (a gated evaluation, a reply to the candidate) is appended to a per-session promise queue instead of guarded by a boolean flag. Concurrent triggers run one after another rather than colliding — and critically, a candidate message that arrives while an evaluation is in flight is *queued*, not silently skipped, so a question is always answered.

Chat messages from the candidate bypass the gate entirely — a question always deserves an answer (`respondToCandidate`).

### Provider abstraction

`backend/src/services/claude.ts` exposes an Anthropic-shaped `messages.create(...)` adapter over the Gemini SDK, including JSON-Schema-to-Gemini-Schema conversion for structured output. The interviewer and evaluator call that interface and never reference a provider directly, so swapping models is a change in one file.

## Evaluation report generator

At the end of a session, `backend/src/services/evaluator.ts` synthesizes everything the interviewer saw into one structured report:

- **The full timestamped transcript** — every question, nudge, and candidate reply, in order. Code snapshots are thinned to at most 5 (first, last, and evenly-spaced middles) so a long session's prompt doesn't balloon with near-duplicate code.
- **A real test run of the final code**, executed through the same sandboxed runner behind "Run code" — so "correctness" in the report is grounded in actual pass/fail results, not a guess. Oral interviews skip this step and grade answer accuracy instead, using a separate evaluator persona.
- One model call returns schema-enforced JSON (`verdict`, `correctness`, `communication`, `codeQuality`, `advice[]`), persisted once and returned unchanged on any later request — generating a report twice never re-runs the model or double-charges an API call.

The frontend (`EvaluationPage.tsx`) shows a brief "writing up the debrief" state while this runs, then staggers the report sections in with a short entrance animation.

## Design system

The interface is dark-first, built from three combined influences: a midnight canvas with frosted-glass surfaces, a blueprint grid, and a conic spotlight halo; monumental uppercase display typography (Space Grotesk) with a single crimson accent reserved for primary actions; and a disciplined component scale — pill-shaped interactive elements, 20px containers, 12px inputs — that keeps the dense working screens legible.

Tokens live in `frontend/tailwind.config.js`; ambient layers and glass utilities in `frontend/src/styles/index.css`; shared primitives (buttons, cards, badges, stat blocks, eyebrows) in `frontend/src/components/ui.tsx`.

## Debugging notes — bugs found and fixed

A dedicated debugging pass over the whole stack turned up several real issues (verified with direct socket clients, `curl`, and a headless-browser walkthrough — not just re-reading the code):

- **Invalid JSON schema.** The interviewer's decision schema declared `message` as `type: ["string", "null"]` — an array-valued `type`, which the structured-output subset doesn't support (only `anyOf` does). Every decision call would have failed. Fixed to `anyOf: [{type: "string"}, {type: "null"}]`.
- **Double greeting on rapid rejoin.** `sessionManager.start()` checked `live.has(sessionId)` before an `await`, so two `session:join` events arriving close together (a flaky reconnect, a double-mount) could both pass the check and spin up two competing session loops. Fixed with a synchronous claim set (`starting`) held for the duration of the async setup.
- **Candidate messages silently dropped.** If a candidate sent a chat message while a periodic/pause evaluation was already mid-call, the old code just returned early — the message was persisted but never answered. Replaced the boolean "evaluating" guard with a proper per-session work queue (see above) so replies are always sent, just possibly delayed behind other queued work.
- **JS solutions in arrow-function style went undetected.** The code runner only recognized `function name(...) {}`; a candidate writing `const twoSum = (nums, target) => {...}` (extremely common in real interviews) got "could not find a function to test" on correct code. Extended the detector to cover arrow functions and function expressions assigned to `const`/`let`/`var`.
- **Python execution assumed `python3` exists.** On Windows (and some Linux setups) only `python` is on `PATH`. The runner now tries `python3` then `python`, and only reports "not available" if neither resolves.
- **Evaluation could read a stale final snapshot.** "End Interview" fired `session:end` and navigated after a guessed 400ms delay — on a slow request, the evaluator could run before the last code snapshot was persisted. Added a socket acknowledgement: the server confirms the snapshot is saved and the session is `COMPLETED` before firing the callback, and the frontend now awaits it instead of guessing.
- **CORS mismatch.** Socket.io was already origin-restricted to `FRONTEND_URL`; the REST API's `cors()` call was wide open. Aligned both to the same origin.
