// Server-only Lovable AI Gateway helper (OpenAI Responses via AI SDK, streamed).
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError } from "ai";
const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";
export const AI_MODEL = "openai/gpt-6-astra";
export class AiError extends Error {
  status;
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
function runIdFetch() {
  let runId;
  return async (input, init) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER))
      headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
    return res;
  };
}
export function aiAvailable() {
  return !!process.env["LOVABLE_API_KEY"];
}
export async function aiObject(schema, instructions, prompt) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("AI is not configured", 401);
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch(),
  });
  let streamError;
  const result = streamText({
    model: provider.responses(AI_MODEL),
    instructions,
    messages: [{ role: "user", content: prompt }],
    output: Output.object({ schema }),
    onError: ({ error }) => {
      streamError = error;
    },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  try {
    return await result.output;
  } catch (e) {
    const err = streamError ?? e;
    if (NoObjectGeneratedError.isInstance(e))
      throw new AiError("AI returned an invalid response");
    const status = err?.statusCode;
    if (status === 402)
      throw new AiError(
        "AI credits are exhausted. Add credits to keep using AI features.",
        402,
      );
    if (status === 429)
      throw new AiError(
        "AI is rate limited right now. Try again in a minute.",
        429,
      );
    if (status === 403)
      throw new AiError("AI access is blocked for this workspace.", 403);
    throw new AiError(err?.message ?? "AI request failed", status);
  }
}
