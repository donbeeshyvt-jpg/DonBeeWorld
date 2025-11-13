import { Server } from "socket.io";

import { postMessage } from "../services/chatService.js";
import { registerSocketServer } from "./socketHub.js";
import { validateSessionToken } from "../services/authService.js";

export function initSocketServer(
  httpServer: import("http").Server,
  origin: string
) {
  const io = new Server(httpServer, {
    cors: { origin }
  });

  registerSocketServer(io);

  io.on("connection", async (socket) => {
    const token =
      typeof socket.handshake.auth?.token === "string"
        ? socket.handshake.auth.token
        : undefined;

    let session = null;
    if (token) {
      session = await validateSessionToken(token);
    }

    let currentChannel = "global";
    socket.join(currentChannel);

    socket.on("joinChannel", (channelKey: string) => {
      socket.leave(currentChannel);
      currentChannel = channelKey ?? "global";
      socket.join(currentChannel);
    });

    socket.on(
      "sendMessage",
      async (data: {
        channelKey: string;
        message: string;
        formatting?: string | null;
      }) => {
        if (!session) return;
        const payload = await postMessage({
          channelKey: data.channelKey ?? currentChannel,
          profileId: session.profileId,
          accountId: session.accountId,
          message: data.message,
          formatting: data.formatting ?? null,
          source: "socket"
        });
        io.to(payload.channelKey).emit("chat:message", payload);
      }
    );
  });

  return io;
}

