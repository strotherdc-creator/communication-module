# Communication Response Module

A blended ethical communication feedback tool for healthcare and wellness staff. Staff input text messages, emails, or verbal conversation summaries and receive AI-generated response recommendations that ethically influence patients toward healthy action.

## Overview

This module synthesizes two complementary communication disciplines — tactical empathy/negotiation structure and behavioral observation/ethical authority — into a single unified system. The methodology is proprietary and de-branded (no external framework names appear in the tool).

## Features

- **Multi-channel support**: Text messages, emails, and verbal conversation coaching
- **Efficient context gathering**: 3-5 dynamic questions (tone, stage, outcome, obstacles, urgency)
- **AI-generated responses**: Channel-appropriate, ready-to-use reply drafts
- **Copy to clipboard**: One-click copy for text/email responses
- **Coach Me mode**: Optional scorecard (/24), strength/leak analysis, ethics check, practice reps
- **Ethics override**: Hard-stop rules prevent manipulative, fear-based, or pressure-based responses
- **Mobile responsive**: Works on phones (staff often respond to texts on mobile)
- **Embeddable**: No branding, designed to be embedded in a staff training website

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19 + TypeScript + TailwindCSS 4 + shadcn/ui |
| Backend | Express + tRPC 11 |
| LLM | Built-in Manus LLM API (OpenAI-compatible) |
| State | Stateless per-request (no patient data stored) |
| Auth | Manus OAuth (optional, module works without auth) |

## Architecture

```
client/src/
  pages/Home.tsx              → Main page (step flow: input → context → output)
  components/
    ConversationInput.tsx     → Step 1: Channel, direction, conversation text
    ContextGathering.tsx      → Step 2: Tone, stage, outcome, obstacles, urgency
    ResponseOutput.tsx        → Step 3: AI response display + copy + coaching

server/
  routers.ts                  → tRPC procedure: communication.generate

prompts/ (project shared files)
  unified-system.md           → Full system prompt (the core IP)
  response-mode.md            → Response generation instructions
  coaching-mode.md            → Scorecard/feedback instructions
```

## How It Works

1. Staff pastes a text/email or describes a verbal conversation
2. System asks 3-5 quick context questions (only what it can't infer)
3. Backend sends conversation + context to LLM with the unified system prompt
4. LLM returns structured JSON: situation read, response, technique, what not to say, follow-up
5. Frontend renders the response with copy-to-clipboard
6. Optional: Coach Me mode adds scorecard, strength/leak, ethics check, practice rep

## Environment Variables

The module uses the built-in Manus LLM API. No additional API keys are required for the core functionality. The following are pre-configured:

- `BUILT_IN_FORGE_API_URL` — LLM API endpoint
- `BUILT_IN_FORGE_API_KEY` — LLM API authentication

## Running Locally

```bash
pnpm install
pnpm dev
```

## Testing

```bash
pnpm test
```

## Deployment

This project is designed for Railway deployment. The `pnpm build` command produces a production bundle, and `pnpm start` runs the Express server.

---

## NEXT AGENT INSTRUCTIONS

### Phase 2 Features to Build

The following features should be added by the next coding agent after reviewing this codebase:

#### 1. FAQ Feedback Engine

Build a system that collects frequently asked questions and common conversation patterns, then pre-generates response templates for the most common scenarios.

**Implementation approach:**
- Add a database table `faq_entries` with columns: `id`, `category`, `scenario_description`, `recommended_response`, `technique_used`, `created_at`, `usage_count`
- Create an admin interface to add/edit FAQ entries
- When a new conversation is submitted, check if it matches a known FAQ pattern before calling the LLM (saves cost and latency)
- Track which FAQ entries are used most often

#### 2. Response History & Active Grading

Build a system that stores conversation submissions and their outcomes, enabling active grading based on results.

**Implementation approach:**
- Add database table `conversation_logs`: `id`, `user_id`, `channel`, `direction`, `conversation_text`, `context_json`, `ai_response_json`, `created_at`
- Add database table `outcome_grades`: `id`, `conversation_log_id`, `outcome` (enum: converted, declined, no_response, follow_up_needed), `staff_notes`, `graded_at`
- After receiving the AI response, staff can later come back and grade the outcome
- Build a dashboard showing: conversion rates by channel, average scores over time, most common obstacles, improvement trends per staff member
- Add a "What happened?" follow-up prompt that appears 24-48 hours after a response is generated

#### 3. Staff Improvement Tracking

**Implementation approach:**
- Track Coach Me scores over time per staff member
- Show trend lines: "Your average score went from 14/24 to 19/24 over 30 days"
- Identify recurring weaknesses: "You consistently score low on Qualification — here's a focused exercise"
- Weekly digest: top 3 improvements, top 1 area to focus on

#### 4. Role-Play Mode (Future)

Add an interactive role-play mode where the AI acts as a prospect and the staff member practices in real-time, then receives feedback.

### Key Files to Understand

| File | Purpose |
|------|---------|
| `server/routers.ts` | The main tRPC procedure — contains the system prompt and LLM call |
| `client/src/components/ResponseOutput.tsx` | The response display component — where grading UI would be added |
| `client/src/pages/Home.tsx` | The step flow controller — where history/FAQ routing would be added |
| Project shared files: `prompts/unified-system.md` | The full system prompt (reference for understanding the methodology) |
| Project shared files: `contradiction_audit.md` | Documents resolved contradictions between source methodologies |

### Database Schema for Phase 2

```sql
CREATE TABLE faq_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(64) NOT NULL,
  scenario_description TEXT NOT NULL,
  recommended_response TEXT NOT NULL,
  technique_used VARCHAR(128),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usage_count INT DEFAULT 0
);

CREATE TABLE conversation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  channel ENUM('text', 'email', 'verbal') NOT NULL,
  direction ENUM('incoming', 'outgoing', 'both') NOT NULL,
  conversation_text TEXT NOT NULL,
  context_json JSON,
  ai_response_json JSON,
  coach_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE outcome_grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_log_id INT NOT NULL,
  outcome ENUM('converted', 'declined', 'no_response', 'follow_up_needed') NOT NULL,
  staff_notes TEXT,
  graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_log_id) REFERENCES conversation_logs(id)
);
```

### Ethical Guardrails (DO NOT REMOVE)

The system prompt in `server/routers.ts` contains critical ethical guardrails. These must NEVER be weakened, removed, or bypassed. They are the legal and ethical foundation of the tool. Any modification to the system prompt must preserve:
- The NEVER list (no fear amplification, no pressure, no identity capture, etc.)
- The ALWAYS list (truth, autonomy, transparency, etc.)
- The contradiction resolution hierarchy
- The ethics override priority (strictest rule wins)
