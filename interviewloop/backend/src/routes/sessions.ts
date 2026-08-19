import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { evaluateSession } from "../services/evaluator.js";

const router = Router();

/** Sessions with an evaluation currently being generated, to dedupe concurrent requests. */
const evaluating = new Map<string, Promise<unknown>>();

// POST /api/sessions — start a new interview session for a problem
router.post("/", async (req, res) => {
  const { problemId, language } = req.body as { problemId?: string; language?: string };
  if (!problemId) {
    return res.status(400).json({ error: "problemId is required" });
  }

  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) {
    return res.status(404).json({ error: "Problem not found" });
  }

  const session = await prisma.interviewSession.create({
    data: {
      problemId,
      language: language ?? "javascript",
    },
  });

  res.status(201).json(session);
});

// GET /api/sessions — history list (past sessions with problem + verdict)
router.get("/", async (_req, res) => {
  const sessions = await prisma.interviewSession.findMany({
    include: {
      problem: { select: { title: true, slug: true, difficulty: true } },
      evaluationReport: { select: { verdict: true } },
    },
    orderBy: { startedAt: "desc" },
  });
  res.json(sessions);
});

// POST /api/sessions/:id/evaluate — generate (or return existing) evaluation report.
// Idempotent, and concurrent calls for the same session share one generation.
router.post("/:id/evaluate", async (req, res) => {
  const sessionId = req.params.id;
  const session = await prisma.interviewSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  try {
    let pending = evaluating.get(sessionId);
    if (!pending) {
      pending = evaluateSession(sessionId).finally(() => evaluating.delete(sessionId));
      evaluating.set(sessionId, pending);
    }
    const report = await pending;
    res.json(report);
  } catch (err) {
    console.error(`[session ${sessionId}] evaluation failed:`, err);
    res.status(502).json({ error: "Evaluation failed. Check the server logs and API key." });
  }
});

// GET /api/sessions/:id — full session detail (transcript + report)
router.get("/:id", async (req, res) => {
  const session = await prisma.interviewSession.findUnique({
    where: { id: req.params.id },
    include: {
      problem: true,
      transcriptEntries: { orderBy: { createdAt: "asc" } },
      evaluationReport: true,
    },
  });
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json(session);
});

export default router;
