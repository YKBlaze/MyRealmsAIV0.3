import { Router, type Request, type Response } from "express";

export const metaRouter = Router();

metaRouter.get("/", (_req: Request, res: Response) => {
  res.json({
    app: {
      name: "MyRealmsAI",
      version: "0.3.0-skeleton",
      mode: "ui-shell",
    },
    worlds: [
      { id: "world-fantasy-ash", name: "Ash March" },
      { id: "world-cyberpunk-neon", name: "Neon Broker" },
      { id: "world-scifi-orbit", name: "Signal Array" },
    ],
    scenes: [
      { id: "fantasy-briarwatch-gate", name: "Briarwatch Gate" },
      { id: "cyberpunk-broker-booth", name: "Broker Booth" },
      { id: "scifi-signal-array", name: "Signal Array" },
    ],
    players: [
      { id: "fantasy-borik-thane", name: "Borik Thane" },
      { id: "cyberpunk-mara-quill", name: "Mara Quill" },
      { id: "scifi-tahl-ren", name: "Tahl Ren" },
    ],
    personalities: [
      { id: "grim", name: "Grim Witness" },
      { id: "lush", name: "Lush Chronicler" },
      { id: "clean", name: "Clean Minimalist" },
    ],
  });
});
