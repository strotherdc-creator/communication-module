/**
 * Communication Response Generator — the core business logic.
 *
 * This module builds the user prompt from input data and calls the LLM provider.
 * It is provider-agnostic: swap `./llm-provider.ts` to change AI backends.
 */

import { callLLM } from "./llm-provider";
import { SYSTEM_PROMPT } from "./system-prompt";

export interface GenerateInput {
  channel: "text" | "email" | "verbal";
  direction: "incoming" | "outgoing" | "both";
  conversation: string;
  context: {
    emotional_tone: string;
    relationship_stage: string;
    desired_outcome: string;
    known_obstacles: string;
    urgency: string;
  };
  coachMode: boolean;
}

export async function generateResponse(input: GenerateInput) {
  const { channel, direction, conversation, context, coachMode } = input;

  const directionLabel =
    direction === "incoming"
      ? "They sent this to us"
      : direction === "outgoing"
      ? "We sent this (need feedback)"
      : "Full thread (both sides)";

  const channelInstruction =
    channel === "verbal"
      ? "talking points with [TONE: warm/calm/curious] and [PAUSE] and [LISTEN FOR: ...] markers"
      : channel === "text"
      ? "text message (short, conversational, under 320 chars)"
      : "email (3-8 sentences, professional but warm)";

  const coachingBlock = coachMode
    ? `,
  "coaching": {
    "scores": {"self_mastery": 0-2, "frame_clarity": 0-2, "listening_quality": 0-2, "tactical_empathy": 0-2, "observation_discipline": 0-2, "information_discovery": 0-2, "questions_silence": 0-2, "authority_clarity": 0-2, "autonomy": 0-2, "ethical_influence": 0-2, "qualification": 0-2, "next_step": 0-2},
    "total_score": 0-24,
    "interpretation": "Excellent/Strong/Inconsistent/Rebuild needed",
    "biggest_strength": "exact behavior worth repeating",
    "biggest_leak": "exact moment resistance likely increased",
    "ethics_check": {"status": "PASS or FLAG", "details": "explanation"},
    "best_next_move": {"technique": "technique name", "explanation": "why this is best now"},
    "practice_rep": "one specific role-play challenge"
  }`
    : "";

  const userPrompt = `CONVERSATION INPUT:
Channel: ${channel}
Direction: ${directionLabel}

CONVERSATION:
${conversation}

CONTEXT:
- Emotional tone: ${context.emotional_tone || "not specified"}
- Relationship stage: ${context.relationship_stage || "not specified"}
- Desired outcome: ${context.desired_outcome}
- Known obstacles: ${context.known_obstacles || "none specified"}
- Urgency: ${context.urgency || "not specified"}

TASK: Generate a response following the Six-Layer Model. Return ONLY valid JSON with this exact structure:
{
  "situation_read": "2-3 sentence summary of what's happening",
  "protecting": ["array of 1-3 concerns they may be protecting"],
  "missing_info": ["array of 1-3 unknown questions that would change the approach"],
  "recommended_response": "The actual ${channelInstruction}",
  "technique_applied": "One sentence explaining which technique is used and why",
  "what_not_to_say": {"bad_example": "the mistake to avoid", "why": "why it increases resistance"},
  "follow_up_question": "One question if they resist or go silent"${coachingBlock}
}`;

  const llmResponse = await callLLM({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  // Strip markdown code fences if present
  let jsonStr = llmResponse.content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}
