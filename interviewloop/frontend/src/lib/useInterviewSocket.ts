import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "./socket";
import type { ChatMessage, TranscriptEntry } from "./types";

interface InterviewerMessageEvent {
  kind: Extract<TranscriptEntry["type"], "INTERVIEWER_QUESTION" | "INTERVIEWER_NUDGE">;
  text: string;
  at: string;
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `local-${idCounter}`;
}

/**
 * Owns the socket lifecycle for one interview session: joins the room,
 * relays code updates, sends candidate chat messages, and accumulates the
 * interviewer's messages + thinking indicator into local state.
 */
export function useInterviewSocket(sessionId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    if (!sessionId) return;
    const socket = socketRef.current;

    function onMessage(evt: InterviewerMessageEvent) {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "interviewer", kind: evt.kind, text: evt.text, at: evt.at },
      ]);
      setThinking(false);
    }

    function onThinking(isThinking: boolean) {
      setThinking(isThinking);
    }

    socket.on("interviewer:message", onMessage);
    socket.on("interviewer:thinking", onThinking);
    socket.emit("session:join", sessionId);

    return () => {
      socket.off("interviewer:message", onMessage);
      socket.off("interviewer:thinking", onThinking);
    };
  }, [sessionId]);

  const sendCode = useCallback(
    (code: string) => {
      if (!sessionId) return;
      socketRef.current.emit("code:update", { sessionId, code });
    },
    [sessionId],
  );

  const sendCandidateMessage = useCallback(
    (text: string) => {
      if (!sessionId || !text.trim()) return;
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "candidate", text, at: new Date().toISOString() },
      ]);
      socketRef.current.emit("candidate:message", { sessionId, text });
    },
    [sessionId],
  );

  /**
   * Resolves once the server confirms the session's final code snapshot is
   * persisted and its status is COMPLETED — or after a timeout, so a dropped
   * ack (e.g. the socket disconnecting) can't strand the UI forever.
   */
  const endSession = useCallback((): Promise<void> => {
    if (!sessionId) return Promise.resolve();
    return new Promise((resolve) => {
      const timeout = setTimeout(resolve, 3000);
      socketRef.current.emit("session:end", sessionId, () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }, [sessionId]);

  return { messages, thinking, sendCode, sendCandidateMessage, endSession };
}
