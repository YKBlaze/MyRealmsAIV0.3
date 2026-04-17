import type { EngineResolvedAction, EngineSessionState, EngineWorldDelta } from "../contract";
import { collectInteractionValueChanges } from "./interact";

export function buildWorldDelta(
  previousState: EngineSessionState,
  nextState: EngineSessionState,
  primaryAction: EngineResolvedAction,
  secondaryAction: EngineResolvedAction | null,
): EngineWorldDelta {
  const valueChanges: string[] = [];
  const actorIdsChanged = nextState.actors
    .filter((nextActor) => {
      const previousActor = previousState.actors.find((candidate) => candidate.id === nextActor.id);

      return (
        previousActor !== undefined &&
        (previousActor.currentAnchorId !== nextActor.currentAnchorId || previousActor.sceneId !== nextActor.sceneId)
      );
    })
    .map((actor) => actor.id);

  if (primaryAction.status === "resolved") {
    valueChanges.push("primary_action_resolved");
  }

  if (secondaryAction?.status === "resolved") {
    valueChanges.push("secondary_action_resolved");
  }

  for (const actorId of actorIdsChanged) {
    const previousActor = previousState.actors.find((candidate) => candidate.id === actorId);
    const updatedActor = nextState.actors.find((candidate) => candidate.id === actorId);

    if (previousActor && updatedActor && previousActor.currentAnchorId !== updatedActor.currentAnchorId) {
      valueChanges.push(`${actorId}.currentAnchorId=${updatedActor.currentAnchorId}`);
    }
  }

  const observedValueChanges = nextState.actors.flatMap((nextActor) => {
    const previousActor = previousState.actors.find((candidate) => candidate.id === nextActor.id);

    if (!previousActor) {
      return [];
    }

    return nextActor.observedAnchorIds
      .filter((anchorId) => !previousActor.observedAnchorIds.includes(anchorId))
      .map((anchorId) => `${nextActor.id}.observedAnchorIds+=${anchorId}`);
  });

  valueChanges.push(...observedValueChanges);
  valueChanges.push(...collectInteractionValueChanges(previousState, nextState));

  return {
    tickDelta: 0,
    sceneChanged: previousState.activeSceneId !== nextState.activeSceneId,
    actorIdsChanged,
    entityIdsChanged: [],
    entityIdsCreated: [],
    entityIdsRemoved: [],
    valueChanges,
  };
}
