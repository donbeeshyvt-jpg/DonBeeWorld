import { Router } from "express";

import {
  claimGatherResult,
  listGatherJobs,
  startGatherJob
} from "../services/gatheringService.js";
import { requireSession } from "../middleware/requireSession.js";

export const gatheringRouter = Router();

gatheringRouter.use(requireSession);

gatheringRouter.post("/jobs", async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { nodeKey, cycles } = req.body ?? {};
    if (!nodeKey) {
      return res.status(400).json({ message: "缺少 nodeKey" });
    }
    const job = await startGatherJob({
      profileId: req.auth.profileId,
      nodeKey: String(nodeKey),
      cycles: cycles ? Number(cycles) : undefined
    });
    return res.status(201).json(job);
  } catch (error) {
    return next(error);
  }
});

gatheringRouter.get("/jobs", async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const jobs = await listGatherJobs(req.auth.profileId);
    return res.json({ jobs });
  } catch (error) {
    return next(error);
  }
});

gatheringRouter.post("/jobs/:jobId/claim", async (req, res, next) => {
  try {
    if (!req.auth) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const jobId = Number(req.params.jobId);
    if (!jobId) {
      return res.status(400).json({ message: "缺少 jobId" });
    }
    const job = await claimGatherResult({
      jobId,
      profileId: req.auth.profileId
    });
    return res.json({
      jobId: job.id,
      claimed: true,
      result: job.result_json
    });
  } catch (error) {
    return next(error);
  }
});

