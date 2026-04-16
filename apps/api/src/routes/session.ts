import { Router, type Request, type Response } from "express";

export const sessionRouter = Router();

sessionRouter.get("/", (_req: Request, res: Response) => {
  res.json({
    sessionId: "skeleton-session",
    status: "idle",
    selectedWorldId: "world-fantasy-ash",
    selectedSceneId: "fantasy-briarwatch-gate",
    selectedPlayerId: "fantasy-borik-thane",
    selectedNarratorPersonalityId: "grim",
    note: "This is a placeholder session shell. No runtime is connected.",
  });
});
