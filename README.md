# Communication Response Module

A blended ethical communication feedback tool for healthcare and wellness staff. This module is **LLM-agnostic** and designed to be embedded into any React-based training website with a standard Express backend.

---

## Architecture Overview

This project has two independent layers that communicate via a single REST endpoint:

| Layer | Technology | Key Files |
|-------|-----------|-----------|
| **API** (backend) | Express.js + TypeScript | `server/routers.ts`, `server/generate.ts`, `server/llm-provider.ts`, `server/system-prompt.ts` |
| **UI** (frontend) | React 19 + TailwindCSS 4 + shadcn/ui | `client/src/pages/Home.tsx`, `client/src/lib/api.ts` |

The frontend calls `POST /api/generate` with conversation data and context. The backend builds a prompt from the system prompt + user input, calls whatever LLM is configured, and returns structured JSON.

---

## UX Design (Single-Page Flow)

The UI is a **single-page flow** — no steps, no wizard, no abstract labels:

1. **Paste the conversation** — big text box, front and center
2. **"What do you want to happen?"** — one line input
3. **Quick toggles** — text/email/verbal + who sent it (They did / I did / Both)
4. **"Add more context (optional)"** — collapsible section with tone, relationship stage, obstacles, Coach Me toggle
5. **"Get Response"** — one big button
6. **Result** — appears below with the response prominently displayed + Copy button, plus supporting sections (what's happening, what they're protecting, why this works, don't say this, if they go silent, scorecard)
7. **"New Conversation"** — reset button at the bottom

This design prioritizes doctors 45-65 who want to get help fast without navigating a multi-step form.

---

## LLM Provider Configuration

The LLM integration lives in a single file: **`server/llm-provider.ts`**. It uses the OpenAI-compatible chat completions format, which works with most providers out of the box.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_API_KEY` | **Yes** | — | API key for your chosen provider |
| `LLM_BASE_URL` | No | `"https://api.openai.com/v1"` | Base URL including version path (the module appends `/chat/completions`) |
| `LLM_MODEL` | No | `"gpt-4o"` | Model ID to use |

### Supported Providers (OpenAI-compatible format)

| Provider | `LLM_BASE_URL` | `LLM_MODEL` example |
|----------|---------------|---------------------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o`, `gpt-4o-mini` |
| Anthropic (compatible) | `https://api.anthropic.com/v1` | `claude-sonnet-4-20250514` |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.0-flash` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| Together AI | `https://api.together.xyz/v1` | `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo` |
| Ollama (local) | `http://localhost:11434/v1` | `llama3.1` |
| LM Studio (local) | `http://localhost:1234/v1` | `loaded-model` |

If your provider uses a non-OpenAI format (e.g., native Anthropic Messages API), replace the `callLLM()` function body in `server/llm-provider.ts` with the appropriate SDK call. The interface (`LLMRequest` → `LLMResponse`) stays the same.

---

## File Structure (What Matters for Integration)

```
server/
  llm-provider.ts       ← THE FILE TO SWAP for different AI providers
  system-prompt.ts      ← The proprietary methodology (your IP)
  generate.ts           ← Builds the user prompt + calls LLM + parses response
  routers.ts            ← Express Router with POST /api/generate + GET /api/health

client/src/
  lib/api.ts            ← Frontend API client (plain fetch, no dependencies)
  pages/Home.tsx        ← Single-page flow (input → generate → result)
  components/
    CoachingFeedback.tsx ← Optional: Scorecard when Coach Me is on
```

---

## How to Integrate Into Your Training Website

### Option 1: Mount the API route in your existing Express app

```ts
import { api } from "./communication-module/server/routers";

// In your existing Express app:
app.use("/api/communication", api);
```

Then point the frontend `API_BASE` in `client/src/lib/api.ts` to `/api/communication`.

### Option 2: Run as a standalone microservice

```bash
cd communication-module
pnpm install
pnpm dev        # Development with hot reload
pnpm build      # Production build
pnpm start      # Run production server
```

### Option 3: Embed the React page into an existing React app

Copy these files into your project:
- `client/src/pages/Home.tsx` (the single-page UI)
- `client/src/lib/api.ts` (the fetch client)
- `client/src/components/CoachingFeedback.tsx` (optional, for Coach Me scorecard)

Update the `API_BASE` constant in `api.ts` to point to wherever you host the Express API.

---

## Railway Deployment

This project is Railway-ready. The `pnpm build` command produces a production bundle and `pnpm start` runs the Express server.

**Required environment variables on Railway:**

```
LLM_API_KEY=your-api-key-here
LLM_BASE_URL=https://api.openai.com/v1   # or your provider (include /v1)
LLM_MODEL=gpt-4o                          # or your model
PORT=3000                                  # Railway sets this automatically
```

Optional for separate frontend hosting:
```
VITE_API_BASE_URL=https://your-api.railway.app/api
```

---

## API Reference

### `POST /api/generate`

**Request body:**

```json
{
  "channel": "text" | "email" | "verbal",
  "direction": "incoming" | "outgoing" | "both",
  "conversation": "The actual conversation text...",
  "context": {
    "emotional_tone": "frustrated",
    "relationship_stage": "new_lead",
    "desired_outcome": "Schedule consultation",
    "known_obstacles": "price, time",
    "urgency": "this_week"
  },
  "coachMode": false
}
```

**Response (200):**

```json
{
  "situation_read": "...",
  "protecting": ["concern1", "concern2"],
  "missing_info": ["question1", "question2"],
  "recommended_response": "The actual response to send...",
  "technique_applied": "...",
  "what_not_to_say": { "bad_example": "...", "why": "..." },
  "follow_up_question": "...",
  "coaching": { ... }
}
```

### `GET /api/health`

Returns `{ "status": "ok", "timestamp": "..." }`

---

## Testing

```bash
pnpm test
```

Tests validate input schema enforcement and the health endpoint. They do not require an LLM API key.

---

## Phase 2 Features (For Next Agent)

After integrating this module into the training website, build these features:

### 1. FAQ Feedback Engine

Store common conversation patterns and pre-generated responses. Check incoming conversations against known patterns before calling the LLM (saves cost and latency). Track which patterns are used most.

### 2. Response History + Active Grading

Store conversation submissions and outcomes. After staff uses a generated response, prompt them 24-48 hours later: "What happened?" Options: converted, declined, no_response, follow_up_needed. Build a dashboard showing conversion rates by channel, average scores over time, and improvement trends per staff member.

### 3. Staff Improvement Tracking

Track Coach Me scores over time per user. Show trend lines and identify recurring weaknesses. Weekly digest: top 3 improvements, top 1 area to focus on.

---

## Ethical Guardrails (DO NOT REMOVE)

The system prompt in `server/system-prompt.ts` contains critical ethical guardrails. These must **never** be weakened, removed, or bypassed. They are the legal and ethical foundation of the tool. Any modification must preserve the NEVER list, the ALWAYS list, the contradiction resolution hierarchy, and the ethics override priority.

---

## Dependencies

| Package | Purpose | Removable? |
|---------|---------|-----------|
| `express` | API server | No (core) |
| `react`, `react-dom` | UI framework | No (core) |
| `tailwindcss` | Styling | Swap if your site uses different CSS |
| `lucide-react` | Icons | Swap for any icon library |
| `sonner` | Toast notifications | Swap for any toast library |
| `shadcn/ui` (radix) | UI components | Already in your project? Reuse. |

The backend has **zero** vendor-specific dependencies. It's just Express + fetch.
