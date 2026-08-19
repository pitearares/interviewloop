import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Lazily creates a single shared Socket.io connection to the backend.
 * Live interviewer events are wired up starting in Phase 2/3.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io("http://localhost:4000", { autoConnect: true });
  }
  return socket;
}
