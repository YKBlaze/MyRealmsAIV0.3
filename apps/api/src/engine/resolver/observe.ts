import type { EngineActionSelection, EngineActionSlot, EngineSessionState } from "../contract";
import { getActor, getScene, rejectAction, resolveAnchorByReference, type ActionOutcome } from "./shared";

export function resolveObserveAction(
  state: EngineSessionState,
  actorId: string,
  slot: EngineActionSlot,
  action: EngineActionSelection,
): ActionOutcome {
  const actor = getActor(state, actorId);

  if (actor === null) {
    return rejectAction(state, slot, action.type, "observe_actor_not_found");
  }

  const scene = getScene(state, actor.sceneId);

  if (scene === null) {
    return rejectAction(state, slot, action.type, "observe_scene_not_found");
  }

  const targetAnchor =
    resolveAnchorByReference(scene, action.targetId, action.targetHint) ??
    scene.anchors.find((anchor) => anchor.id === actor.currentAnchorId) ??
    null;

  if (targetAnchor === null) {
    return rejectAction(state, slot, action.type, "observe_target_not_found");
  }

  const nextObservedAnchorIds = actor.observedAnchorIds.includes(targetAnchor.id)
    ? actor.observedAnchorIds
    : [...actor.observedAnchorIds, targetAnchor.id];

  const nextActors = state.actors.map((currentActor) =>
    currentActor.id === actor.id ? { ...currentActor, observedAnchorIds: nextObservedAnchorIds } : currentActor,
  );

  return {
    action: {
      slot,
      type: action.type,
      status: "resolved",
      reasonCode: null,
      worldChanges: [
        `${actor.id} observed ${targetAnchor.label}`,
        ...targetAnchor.observationDetails.map((detail) => `revealed:${detail}`),
      ],
    },
    nextState: {
      ...state,
      actors: nextActors,
    },
  };
}
