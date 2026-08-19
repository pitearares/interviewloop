import express from "express";
import cors from "cors";
import problemsRouter from "./routes/problems.js";
import sessionsRouter from "./routes/sessions.js";
import runRouter from "./routes/run.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/problems", problemsRouter);
  app.use("/api/sessions", sessionsRouter);
  app.use("/api/run", runRouter);

  return app;
}
