import type { Server } from "socket.io";

let ioInstance: Server | null = null;

export function registerSocketServer(io: Server) {
  ioInstance = io;
}

export function emitChatMessage(payload: unknown) {
  if (!ioInstance) return;
  ioInstance.to(String((payload as any)?.channelKey ?? "global")).emit("chat:message", payload);
}

export function emitAnnouncement(payload: unknown) {
  if (!ioInstance) return;
  ioInstance.emit("chat:announcement", payload);
}

