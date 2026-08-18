/**
 * LLM Provider Interface — SWAP THIS FILE to change AI providers.
 *
 * This module defines a provider-agnostic interface for calling any LLM.
 * The next agent should replace the implementation inside `callLLM()`
 * with whatever provider they choose (OpenAI, Anthropic, Gemini, Groq,
 * Ollama, etc.). The interface stays the same.
 *
 * CONFIGURATION:
 * Set these environment variables:
 *   LLM_API_KEY     — Your API key for the chosen provider
 *   LLM_BASE_URL    — Full base URL including version path
 *                     e.g., "https://api.openai.com/v1"
 *                     e.g., "https://api.groq.com/openai/v1"
 *                     e.g., "http://localhost:11434/v1"
 *   LLM_MODEL       — Model ID (default: "gpt-4o")
 */

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Returns the configured provider settings from environment variables.
 */
function getConfig() {
  return {
    apiKey: process.env.LLM_API_KEY || "",
    baseUrl: (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
    model: process.env.LLM_MODEL || "gpt-4o",
  };
}

/**
 * Call the configured LLM provider.
 *
 * This uses the OpenAI-compatible chat completions format, which is supported by:
 * - OpenAI (native)
 * - Anthropic (via their OpenAI-compatible endpoint)
 * - Google Gemini (via OpenAI-compatible endpoint)
 * - Groq (native OpenAI-compatible)
 * - Together AI (native OpenAI-compatible)
 * - Ollama (native OpenAI-compatible)
 * - LM Studio (native OpenAI-compatible)
 * - Any OpenAI-compatible proxy
 *
 * To use a provider with a different API format (e.g., native Anthropic Messages API),
 * replace the fetch call below with the appropriate SDK or HTTP call.
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const config = getConfig();

  if (!config.apiKey) {
    throw new Error(
      "LLM_API_KEY is not set. Configure it in your environment variables.\n" +
      "Supported providers: OpenAI, Anthropic, Gemini, Groq, Together, Ollama, or any OpenAI-compatible API."
    );
  }

  const model = request.model || config.model;
  // baseUrl already includes the version path (e.g., /v1)
  // We just append /chat/completions
  const url = `${config.baseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("LLM returned empty response");
  }

  return {
    content,
    model: data.model || model,
    usage: data.usage,
  };
}
