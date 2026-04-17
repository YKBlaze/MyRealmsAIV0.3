import {
  isDirectorIntentAction,
  type DirectorIntentResponse,
} from "./intent";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "MHKetbi/Mistral-Small3.1-24B-Instruct-2503:q3_K_L";

const SYSTEM_PROMPT = `You are the MyRealmsAI DM Director.
Your task is to classify a player's free-form input into structured action data.

Allowed action families:
- move
- observe
- interact
- social
- combat
- use

Rules:
- Return only JSON.
- Choose exactly one primaryAction object.
- secondaryAction is optional and may be null.
- Each action object must contain:
  - type
  - verb
  - targetHint
- verb must be a short lowercase action word taken from the player's intent.
- targetHint must be the thing, person, prop, or location inside the scene the player seems to be acting on.
- If no concrete target is present, targetHint must be null.
- For generic movement like "run around", "move around", or "walk around", set targetHint to null.
- If type is interact, verb must be one of: open, close, push, pull, touch, knock, break.
- Never invent action types outside the allowed list.
- If the input is ambiguous, still choose the closest valid action family.
- If the input contains two linked actions, choose the dominant one as primaryAction and the follow-up as secondaryAction.

Output shape:
{"primaryAction":{"type":"move","verb":"walk","targetHint":"the tree"},"secondaryAction":null}`;

export async function classifyDirectorIntent(input: string): Promise<DirectorIntentResponse> {
  let lastError = "Director model returned invalid output.";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const content = await requestDirectorResponse(input, attempt === 0 ? null : lastError);

    try {
      const parsed = JSON.parse(content) as unknown;

      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("Director model returned a non-object response.");
      }

      const primaryAction = "primaryAction" in parsed ? parsed.primaryAction : undefined;
      const secondaryAction = "secondaryAction" in parsed ? parsed.secondaryAction : undefined;

      if (!isDirectorIntentAction(primaryAction)) {
        throw new Error("Director model returned invalid primaryAction.");
      }

      if (secondaryAction === null || isDirectorIntentAction(secondaryAction)) {
        return {
          primaryAction,
          secondaryAction,
        };
      }

      return {
        primaryAction,
        secondaryAction: null,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Director model returned invalid output.";
    }
  }

  throw new Error(lastError);
}

async function requestDirectorResponse(input: string, retryReason: string | null): Promise<string> {
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
        {
          role: "user",
          content:
            retryReason === null
              ? input
              : [
                  `Player input: ${input}`,
                  `Your previous output was invalid: ${retryReason}`,
                  "Return corrected JSON only.",
                ].join("\n"),
        },
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
    throw new Error("Director model returned an empty response.");
  }

  return content;
}
