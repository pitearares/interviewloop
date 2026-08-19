# InterviewLoop

Practice technical interviews with an AI interviewer that actually watches you work.

You pick a problem, write code in a real editor, and the interviewer reads your screen as you type. It asks the questions a real interviewer would ask, nudges you when you get stuck, and writes you an honest debrief when the clock stops.

## What you can do

**Practice three tracks.** General algorithm problems in JavaScript or Python, plus dedicated Java and C++ tracks aimed at junior developer roles.

**Two kinds of interview.**

- *Coding sessions* give you a live editor, a timer, and a "Run code" button that tests your solution against real cases.
- *Oral sessions* have no editor at all. The interviewer asks knowledge questions one at a time (things like "why are Strings immutable in Java?"), reacts to your answer, and digs deeper where your answer was thin.

**Get a real debrief.** At the end you get a verdict plus written feedback on three fronts: whether your solution was correct, how well you communicated, and the quality of your code. Every point references something you actually did during the session.

**Track your progress.** Create an account and every session is saved. The dashboard shows your positive rate, your day streak, how you score by topic, and how your verdicts trend over time.

## How a session works

1. **Pick a track and a problem.** Choose your language, then the problem you want. The clock starts when the room opens.
2. **Work out loud.** Type your solution while narrating your thinking in the chat. Explain yourself and the interviewer stays quiet. Go silent for a while and it will ask what you are building.
3. **Read the debrief.** End the interview and the interviewer writes up what went well and what to work on next time.

## Getting started

You need [Node.js](https://nodejs.org) installed, plus a PostgreSQL database and a Google Gemini API key. Both have free tiers: [Neon](https://neon.tech) for the database, [Google AI Studio](https://aistudio.google.com/app/apikey) for the key.

### 1. Start the backend

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in two values:

- `DATABASE_URL`: your PostgreSQL connection string (keep the `?sslmode=require` at the end if your provider uses it)
- `GEMINI_API_KEY`: your Gemini API key

Then set up the database and start the server:

```bash
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

The backend runs on `http://localhost:4000`.

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser, create an account, and you are ready to practice.

> **Note:** both servers need to run at the same time, in separate terminals.

### Which languages actually run

The "Run code" button executes your solution against the problem's test cases:

| Language | Runs your tests? | Notes |
|---|---|---|
| JavaScript | Yes | Sandboxed, works with no extra setup |
| Python | Yes | Needs `python` or `python3` installed |
| Java, C++ | No | You still write code and the interviewer reviews it live, but tests are not executed |

For Java and C++, the interviewer reads your code as you write it and the final debrief grades it by reading. You just do not get automated pass/fail results.

## Environment variables

All of these live in `backend/.env`:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GEMINI_API_KEY` | Yes | Gemini API key, used for the interviewer and the debrief |
| `PORT` | No | Backend port, defaults to `4000` |
| `FRONTEND_URL` | No | Allowed origin for CORS, defaults to `http://localhost:5173` |

## Tech stack

- **Frontend:** React, TypeScript, Vite, Monaco Editor, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, Socket.io
- **Database:** PostgreSQL via Prisma
- **AI:** Google Gemini (`gemini-3.6-flash`)
- **Auth:** session cookies with scrypt password hashing, no external auth service

## Project structure

```
interviewloop/
  frontend/
    src/pages/       Landing, Login, Practice, Interview, Evaluation, History, Dashboard
    src/components/  UI primitives, editor, interviewer panel, problem panel
  backend/
    src/routes/      auth, problems, sessions, run, stats
    src/services/    interviewer, evaluator, sessionManager, codeRunner, auth
```

## How the interviewer decides when to speak

This is the interesting part of the project, so it is worth explaining.

A live interviewer has to react to code as you write it. The naive approaches both fail: calling the AI on every keystroke is slow and expensive, while a timer that fires a canned hint every two minutes feels scripted and annoying.

InterviewLoop splits the problem into two layers.

### Layer 1: a simple gate that costs nothing

Before the AI is involved at all, a plain function decides whether this moment is even worth looking at. It reads the session state (how long you have been going, how long since you last typed, how many times it has already spoken) and answers yes or no. The rules are ordinary `if` statements:

- Stay quiet for the first 60 seconds so you can read the problem.
- Never speak within 60 seconds of its own last message, or 15 seconds of yours.
- Interrupt at most 6 times per session, unless you are genuinely stuck.
- If the editor is empty, say nothing for two minutes. You are probably thinking.
- In oral interviews, skip all the editor rules. There is no code to watch, so a quiet candidate just needs re-engaging.

Because this layer is just code, most checks cost zero tokens, the behaviour can be tested without an API call (`npm run exercise` replays a scripted session through it), and there is always a loggable reason for why the interviewer spoke.

### Layer 2: one AI call that picks what to say

Only when the gate says yes does the backend ask the model. It sends the session state and gets back a structured answer: stay silent, ask a question, give a nudge, or ask for an explanation, plus the message itself.

The model is still allowed to choose silence. That is deliberate. The gate only has to be roughly right about *when to look*. The model decides whether speaking is actually useful.

### Keeping it fast and cheap

- Checks are triggered by pauses, not keystrokes: 30 seconds after you stop typing, 75 seconds of total inactivity, or a 90 second periodic check.
- Every AI call for a session goes into a queue instead of running in parallel. This matters most for chat: if you ask a question while the interviewer is mid-evaluation, your message is queued rather than dropped, so it always gets answered.
- Messages you send in chat skip the gate entirely. A question always deserves an answer.

### Swapping the AI provider

`backend/src/services/claude.ts` wraps the Gemini SDK behind a small, provider-neutral interface. The interviewer and evaluator never reference a provider directly, so switching models is a change to one file.

## How the debrief is written

When you end a session, the evaluator gathers everything the interviewer saw and makes a single AI call:

- **The full timestamped transcript**, every question, nudge, and reply in order. Code snapshots are thinned down to at most five (first, last, and a few in between) so a long session does not produce a huge, repetitive prompt.
- **A real test run of your final code**, using the same sandbox as the "Run code" button. This means the correctness section is based on actual results, not a guess. Oral interviews skip this and grade the accuracy of your answers instead.
- The report is saved the first time it is generated, so revisiting it never re-runs the model or costs another API call.

## Accounts and privacy

Accounts are handled in-house, without an external auth service:

- Passwords are hashed with scrypt (built into Node) using a random salt, and compared in a way that resists timing attacks.
- Signing in creates a random token stored in the database and sent as an `httpOnly` cookie. Because the session lives on the server, signing out genuinely revokes access.
- A failed login gives the same message whether the email is unknown or the password is wrong, so the app never reveals which emails have accounts.
- Your sessions are yours. History, statistics, and session pages all filter by user, and asking for someone else's session returns "not found".

## Adding your own problems

Problems live in `backend/prisma/seed.ts`. Each one has a **track** (`GENERAL`, `JAVA`, `CPP`) and a **kind** (`CODING` for editor sessions, `THEORY` for oral ones). For theory problems, the prompt holds the question bank the interviewer works through.

To add a whole new track, seed some problems with a new track value and register it in `TRACKS` in `frontend/src/pages/ProblemSelectPage.tsx`. Filtering, topics, the interview room, and the debrief all pick it up automatically.

After editing the seed file:

```bash
npm run prisma:seed
```

## Bugs found and fixed during development

A dedicated debugging pass over the whole stack turned up several real issues, found by testing with socket clients and a headless browser rather than just re-reading the code:

- **The AI decision schema was invalid.** It declared a field as `type: ["string", "null"]`, which structured output does not support. Every decision call would have failed.
- **Rejoining quickly caused a double greeting.** Two join events arriving close together could both start a session loop. Fixed with a claim that is held for the whole setup.
- **Chat messages were silently dropped.** If you sent a message while an evaluation was running, it was saved but never answered. Replaced the blocking flag with a proper queue.
- **Arrow-function solutions were not detected.** Writing `const twoSum = (nums, target) => {...}` produced "could not find a function to test" on perfectly correct code.
- **Python only worked if `python3` existed.** On Windows the command is often just `python`. The runner now tries both.
- **The debrief could read stale code.** Ending an interview navigated away after a guessed delay, so the evaluator sometimes ran before the final code was saved. The server now confirms the save before the page moves on.
- **CORS was inconsistent.** Socket.io was locked to one origin while the REST API was open to everyone. Both are now aligned.
