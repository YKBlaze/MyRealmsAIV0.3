import { Router, type Request, type Response } from "express";

export const messagesRouter = Router();

messagesRouter.post("/", (req: Request, res: Response) => {
  res.status(501).json({
    ok: false,
    message: "Message handling is intentionally unimplemented in the V0.3 skeleton.",
    received: {
      input: req.body?.input ?? "",
      sessionId: req.body?.sessionId ?? null,
    },
  });
});
