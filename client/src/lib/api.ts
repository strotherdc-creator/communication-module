/**
 * API Client — simple fetch wrapper for the communication module.
 *
 * No tRPC, no vendor dependencies. Just fetch.
 *
 * CONFIGURATION:
 * - If the frontend and backend are served from the same origin, leave API_BASE as "/api"
 * - If embedding the frontend in a different app, set VITE_API_BASE_URL in your .env
 *   e.g., VITE_API_BASE_URL=https://your-api.railway.app/api
 */

const API_BASE = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL)
  || "/api";

export interface GenerateRequest {
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

export interface GenerateResponse {
  situation_read: string;
  protecting: string[];
  missing_info: string[];
  recommended_response: string;
  technique_applied: string;
  what_not_to_say: { bad_example: string; why: string };
  follow_up_question: string;
  coaching?: {
    scores: Record<string, number>;
    total_score: number;
    interpretation: string;
    biggest_strength: string;
    biggest_leak: string;
    ethics_check: { status: string; details: string };
    best_next_move: { technique: string; explanation: string };
    practice_rep: string;
  };
}

export async function generateCommunicationResponse(
  input: GenerateRequest
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}
