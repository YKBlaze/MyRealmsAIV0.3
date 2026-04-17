import { Router, type Request, type Response } from "express";
import { classifyDirectorIntent } from "../director/ollamaDirector";

export const directorRouter: Router = Router();

directorRouter.post("/intent", async (req: Request, res: Response) => {
  const input = typeof req.body?.input === "string" ? req.body.input.trim() : "";

  if (input.length === 0) {
    res.status(400).json({
      ok: false,
      error: "Request must include a non-empty input string.",
    });
    return;
  }

  try {
    const intent = await classifyDirectorIntent(input);

    res.json({
      ok: true,
      input,
      intent,
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown director model error.",
    });
  }
});
