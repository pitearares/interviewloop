import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { runCode, type RunTestCase } from "../services/codeRunner.js";

const router = Router();

// POST /api/run — execute candidate code against a problem's test cases
router.post("/", async (req, res) => {
  const { problemId, language, code } = req.body as {
    problemId?: string;
    language?: string;
    code?: string;
  };
  if (!problemId || typeof code !== "string") {
    return res.status(400).json({ error: "problemId and code are required" });
  }

  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) {
    return res.status(404).json({ error: "Problem not found" });
  }

  const testCases = JSON.parse(problem.testCases) as RunTestCase[];
  const result = await runCode(language ?? "javascript", code, testCases);
  res.json(result);
});

export default router;
