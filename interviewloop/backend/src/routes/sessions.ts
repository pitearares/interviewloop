import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { evaluateSession } from "../services/evaluator.js";
import type { AuthedRequest } from "../services/auth.js";

const router = Router();

/** Sessions with an evaluation currently being generated, to dedupe concurrent requests. */
const evaluating = new Map<string, Promise<unknown>>();

// POST /api/sessions — start a new interview session for a problem
router.post("/", async (req: AuthedRequest, res) => {
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
      userId: req.userId,
      language: language ?? "javascript",
    },
  });

  res.status(201).json(session);
});

// GET /api/sessions — history list for the signed-in user
router.get("/", async (req: AuthedRequest, res) => {
  const sessions = await prisma.interviewSession.findMany({
    where: { userId: req.userId },
    include: {
      problem: { select: { title: true, slug: true, difficulty: true } },
      evaluationReport: { select: { verdict: true } },
    },
    orderBy: { startedAt: "desc" },
  });
  res.json(sessions);
});

/** Legacy pre-account sessions have no owner; everyone else only sees their own. */
function ownedBy(session: { userId: string | null }, userId: string | undefined): boolean {
  return session.userId === null || session.userId === userId;
}

// POST /api/sessions/:id/evaluate — generate (or return existing) evaluation report.
// Idempotent, and concurrent calls for the same session share one generation.
router.post("/:id/evaluate", async (req: AuthedRequest, res) => {
  const sessionId = req.params.id;
  const session = await prisma.interviewSession.findUnique({ where: { id: sessionId } });
  if (!session || !ownedBy(session, req.userId)) {
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
router.get("/:id", async (req: AuthedRequest, res) => {
  const session = await prisma.interviewSession.findUnique({
    where: { id: req.params.id },
    include: {
      problem: true,
      transcriptEntries: { orderBy: { createdAt: "asc" } },
      evaluationReport: true,
    },
  });
  if (!session || !ownedBy(session, req.userId)) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json(session);
});

export default router;
