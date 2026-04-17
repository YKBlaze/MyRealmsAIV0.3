import { ENGINE_ACTION_TYPES, type EngineActionSelection, type EngineActionSlot, type EngineSessionState, type EngineTurnRequest, type EngineTurnResult } from "./contract";
import { resolveInteractAction } from "./resolver/interact";
import { resolveMoveAction } from "./resolver/move";
import { resolveObserveAction } from "./resolver/observe";
import { rejectAction, skipAction, unresolvedAction, type ActionOutcome } from "./resolver/shared";
import { buildWorldDelta } from "./resolver/worldDelta";

const ACTION_TYPE_SET = new Set<string>(ENGINE_ACTION_TYPES);

export function resolveTurn(state: EngineSessionState, request: EngineTurnRequest): EngineTurnResult {
  const nextTurn = state.turn + 1;

  const primaryOutcome = resolveAction(state, request.actorId, "primary", request.primaryAction);
  const secondaryOutcome =
    request.secondaryAction === null
      ? null
      : primaryOutcome.action.status !== "resolved"
        ? {
            action: skipAction(request.secondaryAction.type, "secondary_blocked_by_primary"),
            nextState: primaryOutcome.nextState,
          }
        : resolveAction(primaryOutcome.nextState, request.actorId, "secondary", request.secondaryAction);

  const nextStateFromActions = secondaryOutcome === null ? primaryOutcome.nextState : secondaryOutcome.nextState;
  const secondaryAction = secondaryOutcome?.action ?? null;
  const worldDelta = buildWorldDelta(state, nextStateFromActions, primaryOutcome.action, secondaryAction);

  return {
    nextState: {
      ...nextStateFromActions,
      turn: nextTurn,
      clock: state.clock + worldDelta.tickDelta,
      lastPlayerInput: request.playerInput,
    },
    resolution: {
      sessionId: request.sessionId,
      turn: nextTurn,
      playerInput: request.playerInput,
      primaryAction: primaryOutcome.action,
      secondaryAction,
      worldDelta,
    },
  };
}

function resolveAction(
  state: EngineSessionState,
  actorId: string,
  slot: EngineActionSlot,
  action: EngineActionSelection,
): ActionOutcome {
  if (!ACTION_TYPE_SET.has(action.type)) {
    return rejectAction(state, slot, action.type, "invalid_action_type");
  }

  if (action.verb.trim().length === 0) {
    return rejectAction(state, slot, action.type, "missing_action_verb");
  }

  return runActionHandler(state, actorId, slot, action);
}

function runActionHandler(
  state: EngineSessionState,
  actorId: string,
  slot: EngineActionSlot,
  action: EngineActionSelection,
): ActionOutcome {
  switch (action.type) {
    case "move":
      return resolveMoveAction(state, actorId, slot, action);
    case "observe":
      return resolveObserveAction(state, actorId, slot, action);
    case "interact":
      return resolveInteractAction(state, actorId, slot, action);
    case "social":
      return unresolvedAction(state, slot, action.type, "social_handler_not_implemented");
    case "combat":
      return unresolvedAction(state, slot, action.type, "combat_handler_not_implemented");
    case "use":
      return unresolvedAction(state, slot, action.type, "use_handler_not_implemented");
  }
}
