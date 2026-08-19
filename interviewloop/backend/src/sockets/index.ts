import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { sessionManager } from "../services/sessionManager.js";

/**
 * Socket protocol (client → server):
 *   session:join    (sessionId)          join the room + start the live session
 *   code:update     ({sessionId, code})  editor content changed
 *   candidate:message ({sessionId, text}) chat message to the interviewer
 *   session:end     (sessionId, ack?)    candidate finished / left; ack() fires
 *                                        once the final snapshot is persisted
 *                                        and the session is marked COMPLETED
 *
 * (server → client):
 *   interviewer:message  {kind, text, at}
 *   interviewer:thinking boolean
 */
export function initSockets(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: process.env.FRONTEND_URL ?? "http://localhost:5173" },
  });

  io.on("connection", (socket) => {
    socket.on("session:join", async (sessionId: string) => {
      if (typeof sessionId !== "string" || !sessionId) return;
      socket.join(sessionId);
      await sessionManager.start(io, sessionId);
    });

    socket.on("code:update", (payload: { sessionId?: string; code?: string }) => {
      if (!payload?.sessionId || typeof payload.code !== "string") return;
      sessionManager.onCodeUpdate(io, payload.sessionId, payload.code);
    });

    socket.on("candidate:message", (payload: { sessionId?: string; text?: string }) => {
      if (!payload?.sessionId || !payload.text?.trim()) return;
      sessionManager.onCandidateMessage(io, payload.sessionId, payload.text.trim());
    });

    socket.on("session:end", async (sessionId: string, ack?: () => void) => {
      if (typeof sessionId === "string" && sessionId) {
        await sessionManager.end(sessionId);
      }
      if (typeof ack === "function") ack();
    });
  });

  return io;
}
