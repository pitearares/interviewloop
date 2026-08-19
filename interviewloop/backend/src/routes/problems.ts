import { Router } from "express";
import { prisma } from "../db/prisma.js";

const router = Router();

// GET /api/problems — list problem bank for the selection screen
router.get("/", async (_req, res) => {
  const problems = await prisma.problem.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      difficulty: true,
      topic: true,
      kind: true,
      track: true,
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(problems);
});

// GET /api/problems/:slug — full problem detail for the interview screen
router.get("/:slug", async (req, res) => {
  const problem = await prisma.problem.findUnique({
    where: { slug: req.params.slug },
  });
  if (!problem) {
    return res.status(404).json({ error: "Problem not found" });
  }
  res.json(problem);
});

export default router;
