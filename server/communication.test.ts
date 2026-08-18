import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("communication.generate", () => {
  it("validates input schema - rejects empty conversation", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.communication.generate({
        channel: "text",
        direction: "incoming",
        conversation: "",
        context: {
          emotional_tone: "neutral",
          relationship_stage: "new_lead",
          desired_outcome: "schedule consultation",
          known_obstacles: "",
          urgency: "this_week",
        },
        coachMode: false,
      })
    ).rejects.toThrow();
  });

  it("validates input schema - rejects invalid channel", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.communication.generate({
        channel: "fax" as any,
        direction: "incoming",
        conversation: "Hello, I saw your ad",
        context: {
          emotional_tone: "neutral",
          relationship_stage: "new_lead",
          desired_outcome: "schedule consultation",
          known_obstacles: "",
          urgency: "this_week",
        },
        coachMode: false,
      })
    ).rejects.toThrow();
  });

  it("accepts valid input schema structure", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // This will call the LLM - we just verify it doesn't throw on schema validation
    // In a real test environment with mocked LLM, this would return a response
    try {
      await caller.communication.generate({
        channel: "text",
        direction: "incoming",
        conversation: "Hi, I saw your ad about the new patient special. How much is it?",
        context: {
          emotional_tone: "neutral",
          relationship_stage: "new_lead",
          desired_outcome: "schedule consultation",
          known_obstacles: "price",
          urgency: "this_week",
        },
        coachMode: false,
      });
    } catch (e: any) {
      // If it fails, it should be an LLM error, not a validation error
      expect(e.message).not.toContain("invalid_type");
      expect(e.message).not.toContain("Required");
    }
  });
});
