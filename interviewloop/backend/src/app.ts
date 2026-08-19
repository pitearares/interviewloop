import express from "express";
import cors from "cors";
import problemsRouter from "./routes/problems.js";
import sessionsRouter from "./routes/sessions.js";
import runRouter from "./routes/run.js";
import statsRouter from "./routes/stats.js";
import authRouter from "./routes/auth.js";
import { attachUser, requireUser } from "./services/auth.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173", credentials: true }));
  app.use(express.json());
  app.use(attachUser);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/problems", problemsRouter);
  app.use("/api/sessions", requireUser, sessionsRouter);
  app.use("/api/run", requireUser, runRouter);
  app.use("/api/stats", requireUser, statsRouter);

  return app;
}
