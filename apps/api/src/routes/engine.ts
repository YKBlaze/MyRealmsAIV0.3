import { Router, type Request, type Response } from "express";
import {
  ENGINE_CONTRACT,
  ENGINE_CONTRACT_EXAMPLE_REQUEST,
  createEngineSessionState,
} from "../engine/contract";
import { resolveTurn } from "../engine/resolver";

export const engineRouter: Router = Router();

engineRouter.get("/contract", (_req: Request, res: Response) => {
  const exampleState = createEngineSessionState({ sessionId: "sandbox-session" });
  const exampleResult = resolveTurn(exampleState, ENGINE_CONTRACT_EXAMPLE_REQUEST);

  res.json({
    contract: ENGINE_CONTRACT,
    examples: {
      state: exampleState,
      request: ENGINE_CONTRACT_EXAMPLE_REQUEST,
      resolution: exampleResult.resolution,
    },
  });
});
