import { Router } from "express";

import {
  createAnnouncement,
  initializeChatSystem,
  listActiveAnnouncements,
  listRecentMessages,
  postMessage,
  scheduleBroadcast
} from "../services/chatService.js";
import { requireSession } from "../middleware/requireSession.js";

export const chatRouter = Router();

chatRouter.get("/channels/:channelKey/messages", async (req, res, next) => {
  try {
    const { channelKey } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const messages = await listRecentMessages(channelKey, limit);
    return res.json({ messages });
  } catch (error) {
    return next(error);
  }
});

chatRouter.post(
  "/channels/:channelKey/messages",
  requireSession,
  async (req, res, next) => {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { channelKey } = req.params;
      const { message, formatting } = req.body ?? {};
      if (!message) {
        return res.status(400).json({ message: "message 不可為空" });
      }
      const payload = await postMessage(
        {
          channelKey,
          message,
          formatting: formatting ?? null,
          profileId: req.auth.profileId,
          accountId: req.auth.accountId,
          source: "http"
        },
        { broadcast: true }
      );
      return res.status(201).json(payload);
    } catch (error) {
      return next(error);
    }
  }
);

chatRouter.get("/announcements", async (_req, res, next) => {
  try {
    const announcements = await listActiveAnnouncements();
    return res.json({ announcements });
  } catch (error) {
    return next(error);
  }
});

chatRouter.post("/announcements", async (req, res, next) => {
  try {
    const { title, content, startAt, endAt, createdBy } = req.body ?? {};
    if (!title || !content) {
      return res.status(400).json({ message: "標題與內容不可為空" });
    }
    const announcement = await createAnnouncement({
      title,
      content,
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      createdBy
    });
    return res.status(201).json(announcement);
  } catch (error) {
    return next(error);
  }
});

chatRouter.post("/broadcasts", async (req, res, next) => {
  try {
    const { channelKey, message, cronExpression, createdBy } = req.body ?? {};
    if (!channelKey || !message || !cronExpression) {
      return res
        .status(400)
        .json({ message: "需要 channelKey、message、cronExpression" });
    }
    const id = await scheduleBroadcast({
      channelKey,
      message,
      cronExpression,
      createdBy
    });
    return res.status(201).json({ id });
  } catch (error) {
    return next(error);
  }
});

// 初始化排程（確保服務啟動即載入）
initializeChatSystem().catch((error) => {
  console.error("初始化聊天排程失敗", error);
});

