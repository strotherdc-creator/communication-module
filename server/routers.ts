/**
 * Server Routes — Portable Express API
 *
 * This file defines the REST API endpoints. No tRPC, no Manus dependencies.
 * The only external dependency is the LLM provider configured in ./llm-provider.ts
 */

import { Router } from "express";
import { generateResponse, type GenerateInput } from "./generate";

const api = Router();

// Health check
api.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Main generation endpoint
api.post("/generate", async (req, res) => {
  try {
    const { channel, direction, conversation, context, coachMode } = req.body as GenerateInput;

    // Validate required fields
    if (!channel || !["text", "email", "verbal"].includes(channel)) {
      res.status(400).json({ error: "Invalid channel. Must be: text, email, or verbal" });
      return;
    }
    if (!direction || !["incoming", "outgoing", "both"].includes(direction)) {
      res.status(400).json({ error: "Invalid direction. Must be: incoming, outgoing, or both" });
      return;
    }
    if (!conversation || typeof conversation !== "string" || conversation.trim().length === 0) {
      res.status(400).json({ error: "Conversation text is required" });
      return;
    }
    if (!context?.desired_outcome || context.desired_outcome.trim().length === 0) {
      res.status(400).json({ error: "Desired outcome is required in context" });
      return;
    }

    const result = await generateResponse({
      channel,
      direction,
      conversation: conversation.trim(),
      context: {
        emotional_tone: context.emotional_tone || "",
        relationship_stage: context.relationship_stage || "",
        desired_outcome: context.desired_outcome.trim(),
        known_obstacles: context.known_obstacles || "",
        urgency: context.urgency || "",
      },
      coachMode: Boolean(coachMode),
    });

    res.json(result);
  } catch (error: any) {
    console.error("[Generate Error]", error.message);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export { api };

