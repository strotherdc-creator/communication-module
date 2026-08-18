import { describe, expect, it } from "vitest";
import express from "express";
import { api } from "./routers";

// Create a test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", api);
  return app;
}

describe("POST /api/generate - input validation", () => {
  const app = createTestApp();

  it("rejects missing channel", async () => {
    const res = await makeRequest(app, {
      direction: "incoming",
      conversation: "Hello",
      context: { desired_outcome: "schedule" },
      coachMode: false,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("channel");
  });

  it("rejects invalid channel value", async () => {
    const res = await makeRequest(app, {
      channel: "fax",
      direction: "incoming",
      conversation: "Hello",
      context: { desired_outcome: "schedule" },
      coachMode: false,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("channel");
  });

  it("rejects empty conversation", async () => {
    const res = await makeRequest(app, {
      channel: "text",
      direction: "incoming",
      conversation: "",
      context: { desired_outcome: "schedule" },
      coachMode: false,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Conversation");
  });

  it("rejects missing desired_outcome", async () => {
    const res = await makeRequest(app, {
      channel: "text",
      direction: "incoming",
      conversation: "Hi, I saw your ad",
      context: { emotional_tone: "neutral" },
      coachMode: false,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Desired outcome");
  });

  it("accepts valid input (will fail at LLM call without key, but passes validation)", async () => {
    const res = await makeRequest(app, {
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
    // Either 200 (LLM worked) or 500 (LLM key missing) — but NOT 400
    expect(res.status).not.toBe(400);
  });
});

describe("GET /api/health", () => {
  const app = createTestApp();

  it("returns ok status", async () => {
    const res = await makeGetRequest(app, "/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
  });
});

// Simple test helpers that don't require supertest
async function makeRequest(app: express.Express, body: any) {
  return new Promise<{ status: number; body: any }>((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address() as any;
      fetch(`http://localhost:${addr.port}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (res) => {
        const responseBody = await res.json();
        server.close();
        resolve({ status: res.status, body: responseBody });
      }).catch((err) => {
        server.close();
        resolve({ status: 500, body: { error: err.message } });
      });
    });
  });
}

async function makeGetRequest(app: express.Express, path: string) {
  return new Promise<{ status: number; body: any }>((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address() as any;
      fetch(`http://localhost:${addr.port}${path}`).then(async (res) => {
        const responseBody = await res.json();
        server.close();
        resolve({ status: res.status, body: responseBody });
      }).catch((err) => {
        server.close();
        resolve({ status: 500, body: { error: err.message } });
      });
    });
  });
}
