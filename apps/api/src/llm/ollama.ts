export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaChatResult {
  model: string;
  content: string;
}

export interface OllamaNarratorContext {
  playerInput: string;
  sceneLabel: string;
  actorAnchorBeforeLabel: string;
  actorAnchorAfterLabel: string;
  positionChanged: boolean;
  observationDetails: string[];
  interactionDetails: string[];
  resolution: unknown;
}

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "MHKetbi/Mistral-Small3.1-24B-Instruct-2503:q3_K_L";

const SYSTEM_PROMPT =
  'You are the MyRealmsAI narrator. The deterministic engine already resolved the turn. Reply only with JSON in the exact shape {"reply":"..."} and nothing else. The reply must be one or two short sentences. Use only the engine truth provided by the user message. Do not echo instructions. Do not echo JSON context. Do not add scenery, appearance, object properties, nearby details, lore, or sensory description unless they appear explicitly in the provided facts.';

export async function generateAssistantReply(
  context: OllamaNarratorContext,
): Promise<OllamaChatResult> {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: "json",
      options: {
        temperature: 0,
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildNarratorPrompt(context) },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });

  const payload = (await response.json()) as {
    error?: string;
    message?: {
      content?: string;
    };
  };

  if (!response.ok) {
    throw new Error(payload.error ?? `Ollama request failed with status ${response.status}`);
  }

  const content = payload.message?.content?.trim();

  if (!content) {
    throw new Error("Ollama returned an empty assistant response.");
  }

  const reply = parseNarratorReply(content);

  return {
    model: OLLAMA_MODEL,
    content: reply,
  };
}

function buildNarratorPrompt(context: OllamaNarratorContext): string {
  return [
    "Player input:",
    context.playerInput,
    "",
    "Use only these facts.",
    `Current scene: ${context.sceneLabel}`,
    `Player position before resolution: ${context.actorAnchorBeforeLabel}`,
    `Player position after resolution: ${context.actorAnchorAfterLabel}`,
    `Position changed: ${context.positionChanged ? "yes" : "no"}`,
    `Observation details: ${context.observationDetails.length === 0 ? "none" : context.observationDetails.join(" | ")}`,
    `Interaction details: ${context.interactionDetails.length === 0 ? "none" : context.interactionDetails.join(" | ")}`,
    "Resolved turn JSON:",
    JSON.stringify(context.resolution, null, 2),
    "If position changed is no, do not say the player moved, arrived, or is now somewhere else.",
    "If observation details are present, you may describe only those details.",
    "If interaction details are present, you may describe only those details.",
    "Forbidden: any extra description, ambiance, object contents, object appearance, worldbuilding, or facts not written above.",
  ].join("\n");
}

function parseNarratorReply(content: string): string {
  const direct = tryReadReply(content);

  if (direct !== null) {
    return direct;
  }

  const fenceStripped = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const fenced = tryReadReply(fenceStripped);

  if (fenced !== null) {
    return fenced;
  }

  const fallback = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .at(-1);

  if (fallback) {
    return fallback;
  }

  throw new Error("Narrator model returned invalid JSON.");
}

function tryReadReply(content: string): string | null {
  try {
    const parsed = JSON.parse(content) as { reply?: unknown };

    if (typeof parsed.reply === "string" && parsed.reply.trim().length > 0) {
      return parsed.reply.trim();
    }
  } catch {}

  return null;
}
