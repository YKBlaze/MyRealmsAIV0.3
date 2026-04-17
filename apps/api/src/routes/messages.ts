import { resolveTurn } from "../engine/resolver";
import { Router, type Request, type Response } from "express";
import { classifyDirectorIntent } from "../director/ollamaDirector";
import type { DirectorIntentAction } from "../director/intent";
import type { EngineActionSelection, EngineResolvedAction, EngineSessionState, EngineTurnRequest } from "../engine/contract";
import { generateAssistantReply, type OllamaChatMessage } from "../llm/ollama";
import { appendSessionTurn, assertSessionExists, readSessionState, writeSessionState } from "../session/storage";

export const messagesRouter: Router = Router();

messagesRouter.post("/", async (req: Request, res: Response) => {
  const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId : null;
  const rawMessages = Array.isArray(req.body?.messages) ? (req.body.messages as unknown[]) : null;

  if (sessionId === null || rawMessages === null) {
    res.status(400).json({
      ok: false,
      error: "Request must include sessionId and messages.",
    });
    return;
  }

  const messages = rawMessages
    .map((message: unknown): OllamaChatMessage | null => {
      if (
        typeof message === "object" &&
        message !== null &&
        "role" in message &&
        "content" in message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
      ) {
        return {
          role: message.role,
          content: message.content,
        };
      }

      return null;
    })
    .filter((message): message is OllamaChatMessage => message !== null);

  if (messages.length === 0) {
    res.status(400).json({
      ok: false,
      error: "Request must include at least one non-empty chat message.",
    });
    return;
  }

  try {
    await assertSessionExists(sessionId);
    const sessionState = await readSessionState(sessionId);

    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

    if (!latestUserMessage) {
      res.status(400).json({
        ok: false,
        error: "Request must include at least one user message.",
      });
      return;
    }

    const intent = await classifyDirectorIntent(latestUserMessage.content);
    const turnRequest = buildTurnRequest(sessionState, latestUserMessage.content, intent);
    const turnResult = resolveTurn(sessionState, turnRequest);

    await writeSessionState(sessionId, turnResult.nextState);

    const reply = await generateAssistantReply({
      playerInput: latestUserMessage.content,
      sceneLabel: getActiveSceneLabel(turnResult.nextState),
      actorAnchorBeforeLabel: getControlledActorAnchorLabel(sessionState),
      actorAnchorAfterLabel: getControlledActorAnchorLabel(turnResult.nextState),
      positionChanged: didControlledActorMove(sessionState, turnResult.nextState),
      observationDetails: collectRevealedObservationDetails(turnResult.resolution),
      interactionDetails: collectInteractionDetails(turnResult.resolution),
      resolution: turnResult.resolution,
    });

    const storedTurn = await appendSessionTurn(sessionId, {
      userInput: latestUserMessage.content,
      intentOutput: intent,
      engineAction: turnResult.resolution as unknown as Record<string, unknown>,
      narratorOutput: reply.content,
    });

    res.json({
      ok: true,
      sessionId,
      turn: storedTurn.turn,
      intent,
      engineAction: turnResult.resolution,
      model: reply.model,
      message: {
        role: "assistant",
        content: reply.content,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown model error.";
    const status = message.includes("was not found") ? 404 : 503;

    res.status(status).json({
      ok: false,
      error: message,
    });
  }
});

function buildTurnRequest(
  state: EngineSessionState,
  playerInput: string,
  intent: {
    primaryAction: DirectorIntentAction;
    secondaryAction: DirectorIntentAction | null;
  },
): EngineTurnRequest {
  return {
    sessionId: state.sessionId,
    actorId: state.controlledActorId,
    playerInput,
    primaryAction: toEngineActionSelection(intent.primaryAction),
    secondaryAction: intent.secondaryAction === null ? null : toEngineActionSelection(intent.secondaryAction),
  };
}

function toEngineActionSelection(action: DirectorIntentAction): EngineActionSelection {
  return {
    type: action.type,
    verb: action.verb,
    targetId: null,
    targetHint: action.targetHint,
    toolEntityId: null,
    tags: [],
  };
}

function getActiveSceneLabel(state: EngineSessionState): string {
  return state.scenes.find((scene) => scene.id === state.activeSceneId)?.label ?? state.activeSceneId;
}

function getControlledActorAnchorLabel(state: EngineSessionState): string {
  const actor = state.actors.find((candidate) => candidate.id === state.controlledActorId);

  if (!actor) {
    return "unknown";
  }

  const scene = state.scenes.find((candidate) => candidate.id === actor.sceneId);
  return scene?.anchors.find((anchor) => anchor.id === actor.currentAnchorId)?.label ?? actor.currentAnchorId;
}

function didControlledActorMove(previousState: EngineSessionState, nextState: EngineSessionState): boolean {
  const previousActor = previousState.actors.find((candidate) => candidate.id === previousState.controlledActorId);
  const nextActor = nextState.actors.find((candidate) => candidate.id === nextState.controlledActorId);

  if (!previousActor || !nextActor) {
    return false;
  }

  return previousActor.sceneId !== nextActor.sceneId || previousActor.currentAnchorId !== nextActor.currentAnchorId;
}

function collectRevealedObservationDetails(resolution: { primaryAction: EngineResolvedAction; secondaryAction: EngineResolvedAction | null }): string[] {
  const changes = [resolution.primaryAction, resolution.secondaryAction]
    .filter((action): action is EngineResolvedAction => action !== null)
    .flatMap((action) => action.worldChanges);

  return changes
    .filter((change) => change.startsWith("revealed:"))
    .map((change) => change.slice("revealed:".length));
}

function collectInteractionDetails(resolution: { primaryAction: EngineResolvedAction; secondaryAction: EngineResolvedAction | null }): string[] {
  const changes = [resolution.primaryAction, resolution.secondaryAction]
    .filter((action): action is EngineResolvedAction => action !== null)
    .flatMap((action) => action.worldChanges);

  return changes
    .filter((change) => change.startsWith("interacted:"))
    .map((change) => change.slice(change.indexOf(":", change.indexOf(":") + 1) + 1));
}
