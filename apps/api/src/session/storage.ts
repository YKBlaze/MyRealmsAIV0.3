import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ENGINE_DEFAULT_SCENE, createDefaultInteractionState, createEngineSessionState, type EngineSessionState } from "../engine/contract";
import type { DirectorIntentResponse } from "../director/intent";

const SESSION_FILE_NAME = "session.txt";
const STATE_FILE_NAME = "state.txt";
const TURN_FILE_PREFIX = "turn-";
const TURN_FILE_SUFFIX = ".txt";
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../");
const SESSIONS_ROOT = resolve(REPO_ROOT, "sessions");

export interface CreatedSessionRecord {
  sessionId: string;
  createdAt: string;
  folderPath: string;
}

export interface StoredTurnRecord {
  turn: number;
  filePath: string;
}

export interface SessionTurnWriteInput {
  userInput: string;
  intentOutput: DirectorIntentResponse;
  engineAction: Record<string, unknown>;
  narratorOutput: string;
}

export async function createSessionRecord(): Promise<CreatedSessionRecord> {
  await mkdir(SESSIONS_ROOT, { recursive: true });

  const createdAt = new Date().toISOString();
  const sessionId = createSessionId(createdAt);
  const folderPath = join(SESSIONS_ROOT, sessionId);
  const initialState = createEngineSessionState({ sessionId });

  await mkdir(folderPath, { recursive: false });
  await writeFile(join(folderPath, SESSION_FILE_NAME), formatSessionFile({ sessionId, createdAt }), "utf8");
  await writeSessionStateFile(folderPath, initialState);

  return {
    sessionId,
    createdAt,
    folderPath,
  };
}

export async function assertSessionExists(sessionId: string): Promise<string> {
  const folderPath = join(SESSIONS_ROOT, sessionId);

  try {
    await access(folderPath, constants.F_OK);
  } catch {
    throw new Error(`Session '${sessionId}' was not found.`);
  }

  return folderPath;
}

export async function appendSessionTurn(sessionId: string, input: SessionTurnWriteInput): Promise<StoredTurnRecord> {
  const folderPath = await assertSessionExists(sessionId);
  const turn = await getNextTurnNumber(folderPath);
  const filePath = join(folderPath, `${TURN_FILE_PREFIX}${String(turn).padStart(4, "0")}${TURN_FILE_SUFFIX}`);

  await writeFile(
    filePath,
    formatTurnFile({
      sessionId,
      turn,
      createdAt: new Date().toISOString(),
      ...input,
    }),
    "utf8",
  );

  return {
    turn,
    filePath,
  };
}

export async function readSessionState(sessionId: string): Promise<EngineSessionState> {
  const folderPath = await assertSessionExists(sessionId);
  const filePath = join(folderPath, STATE_FILE_NAME);
  const content = await readFile(filePath, "utf8");
  const parsed = JSON.parse(content) as Partial<EngineSessionState> & Pick<EngineSessionState, "sessionId">;

  return createEngineSessionState({
    sessionId: parsed.sessionId,
    campaignId: parsed.campaignId,
    turn: parsed.turn,
    clock: parsed.clock,
    activeSceneId: parsed.activeSceneId,
    controlledActorId: parsed.controlledActorId,
    scenes: hydrateScenes(parsed.scenes),
    actors: parsed.actors,
    sceneIds: parsed.sceneIds,
    actorIds: parsed.actorIds,
    entityIds: parsed.entityIds,
    lastPlayerInput: parsed.lastPlayerInput,
  });
}

export async function writeSessionState(sessionId: string, state: EngineSessionState): Promise<void> {
  const folderPath = await assertSessionExists(sessionId);
  await writeSessionStateFile(folderPath, state);
}

function createSessionId(createdAt: string): string {
  const date = new Date(createdAt);
  const dateStamp = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
  const timeStamp = [
    String(date.getUTCHours()).padStart(2, "0"),
    String(date.getUTCMinutes()).padStart(2, "0"),
    String(date.getUTCSeconds()).padStart(2, "0"),
  ].join("");
  const suffix = randomBytes(3).toString("hex");

  return `session-${dateStamp}-${timeStamp}-${suffix}`;
}

async function getNextTurnNumber(folderPath: string): Promise<number> {
  const files = await readdir(folderPath);
  const turnFiles = files.filter(
    (fileName) => fileName.startsWith(TURN_FILE_PREFIX) && fileName.endsWith(TURN_FILE_SUFFIX),
  );

  return turnFiles.length + 1;
}

function formatSessionFile(input: { sessionId: string; createdAt: string }): string {
  return [
    `Session ID: ${input.sessionId}`,
    `Created At: ${input.createdAt}`,
    "",
    "This folder contains one text file per turn.",
    "The current deterministic engine state is stored in state.txt.",
  ].join("\n");
}

function formatTurnFile(input: {
  sessionId: string;
  turn: number;
  createdAt: string;
  userInput: string;
  intentOutput: DirectorIntentResponse;
  engineAction: Record<string, unknown>;
  narratorOutput: string;
}): string {
  return [
    `Session ID: ${input.sessionId}`,
    `Turn: ${input.turn}`,
    `Created At: ${input.createdAt}`,
    "",
    "[User Input]",
    input.userInput,
    "",
    "[Intent Output]",
    JSON.stringify(input.intentOutput, null, 2),
    "",
    "[Engine Action]",
    JSON.stringify(input.engineAction, null, 2),
    "",
    "[Narrator Output]",
    input.narratorOutput,
    "",
  ].join("\n");
}

async function writeSessionStateFile(folderPath: string, state: EngineSessionState): Promise<void> {
  await writeFile(join(folderPath, STATE_FILE_NAME), JSON.stringify(state, null, 2), "utf8");
}

function hydrateScenes(rawScenes: EngineSessionState["scenes"] | undefined): EngineSessionState["scenes"] | undefined {
  if (!Array.isArray(rawScenes) || rawScenes.length === 0) {
    return undefined;
  }

  return rawScenes.map((scene) => {
    const defaultScene = scene.id === ENGINE_DEFAULT_SCENE.id ? ENGINE_DEFAULT_SCENE : null;

    return {
      ...scene,
      anchors: scene.anchors.map((anchor) => ({
        ...anchor,
        neighborAnchorIds:
          Array.isArray(anchor.neighborAnchorIds) && anchor.neighborAnchorIds.length > 0
            ? [...anchor.neighborAnchorIds]
            : defaultScene?.anchors.find((defaultAnchor) => defaultAnchor.id === anchor.id)?.neighborAnchorIds ?? [],
        observationDetails:
          Array.isArray(anchor.observationDetails) && anchor.observationDetails.length > 0
            ? [...anchor.observationDetails]
            : defaultScene?.anchors.find((defaultAnchor) => defaultAnchor.id === anchor.id)?.observationDetails ?? [],
        interactionState:
          typeof anchor.interactionState === "object" && anchor.interactionState !== null
            ? {
                ...createDefaultInteractionState(),
                ...anchor.interactionState,
              }
            : {
                ...(defaultScene?.anchors.find((defaultAnchor) => defaultAnchor.id === anchor.id)?.interactionState ??
                  createDefaultInteractionState()),
              },
      })),
    };
  });
}
