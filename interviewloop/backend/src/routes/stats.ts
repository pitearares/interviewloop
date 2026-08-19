import { Router } from "express";
import { prisma } from "../db/prisma.js";
import type { AuthedRequest } from "../services/auth.js";

const router = Router();

/** Local calendar day key (YYYY-MM-DD) — streaks are counted in the user's day, not UTC. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Counts consecutive days ending today (or yesterday, so an unstarted
 * today doesn't reset a live streak) that contain at least one session.
 */
function currentStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const days = new Set(dates.map(dayKey));

  const cursor = new Date();
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// GET /api/stats — aggregate practice metrics for the signed-in user
router.get("/", async (req: AuthedRequest, res) => {
  const sessions = await prisma.interviewSession.findMany({
    where: { userId: req.userId },
    include: {
      problem: { select: { title: true, slug: true, difficulty: true, topic: true } },
      evaluationReport: { select: { verdict: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  const completed = sessions.filter((s) => s.status === "COMPLETED");
  const graded = sessions.filter((s) => s.evaluationReport !== null);
  const positive = graded.filter(
    (s) => s.evaluationReport!.verdict === "STRONG_HIRE" || s.evaluationReport!.verdict === "HIRE",
  );

  const durations = completed.map((s) => s.durationSec ?? 0).filter((d) => d > 0);
  const totalSec = durations.reduce((a, b) => a + b, 0);

  const byVerdict: Record<string, number> = {};
  for (const s of graded) {
    const v = s.evaluationReport!.verdict;
    byVerdict[v] = (byVerdict[v] ?? 0) + 1;
  }

  const byTopic: Record<string, { total: number; positive: number }> = {};
  for (const s of graded) {
    const t = s.problem.topic;
    byTopic[t] ??= { total: 0, positive: 0 };
    byTopic[t].total += 1;
    const v = s.evaluationReport!.verdict;
    if (v === "STRONG_HIRE" || v === "HIRE") byTopic[t].positive += 1;
  }

  const byDifficulty: Record<string, number> = {};
  for (const s of sessions) {
    const d = s.problem.difficulty;
    byDifficulty[d] = (byDifficulty[d] ?? 0) + 1;
  }

  // Oldest-first so the dashboard can plot the verdict trend left to right.
  const timeline = graded
    .slice()
    .reverse()
    .map((s) => ({
      id: s.id,
      title: s.problem.title,
      verdict: s.evaluationReport!.verdict,
      startedAt: s.startedAt,
      durationSec: s.durationSec,
    }));

  res.json({
    totalSessions: sessions.length,
    completedSessions: completed.length,
    gradedSessions: graded.length,
    positiveRate: graded.length ? Math.round((positive.length / graded.length) * 100) : null,
    totalPracticeSec: totalSec,
    avgDurationSec: durations.length ? Math.round(totalSec / durations.length) : null,
    streakDays: currentStreak(sessions.map((s) => s.startedAt)),
    distinctProblems: new Set(sessions.map((s) => s.problem.slug)).size,
    byVerdict,
    byTopic,
    byDifficulty,
    timeline,
  });
});

export default router;
