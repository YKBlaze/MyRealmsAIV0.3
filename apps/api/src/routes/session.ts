import { Router, type Request, type Response } from "express";
import { createSessionRecord } from "../session/storage";

export const sessionRouter: Router = Router();

sessionRouter.get("/", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    note: "Create a new session with POST /api/session.",
  });
});

sessionRouter.post("/", async (_req: Request, res: Response) => {
  try {
    const session = await createSessionRecord();

    res.status(201).json({
      ok: true,
      session,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create session.",
    });
  }
});
