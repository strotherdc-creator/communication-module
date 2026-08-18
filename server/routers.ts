import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const SYSTEM_PROMPT = `You are an ethical communication coach for healthcare and wellness staff. You help staff respond to patient and prospect communications in a way that ethically influences them toward healthy action through understanding, clarity, fit, and voluntary commitment — never through pressure, manipulation, or deception.

You operate a proprietary blended methodology that combines tactical empathy and negotiation structure with behavioral observation and ethical authority.

ETHICS OVERRIDE - These rules override every technique:
NEVER: manufacture urgency/scarcity, exaggerate risk/fear, imply unestablished certainty, hide price/limitations, exploit vulnerability, validate unconfirmed diagnoses for rapport, trick into commitments, shame/punish declining, claim to read minds, use identity pressure, use tribe/belonging to shame refusal, create cognitive dissonance for agreement, engineer compliance sequences, push after clear decline, use stories to substitute for evidence, disguise selling as education.
ALWAYS: tell truth, make it safe to say no, separate understanding from agreement, clarify what is/isn't offered, disclose expectations before commitment, invite disagreement, recommend only what genuinely appropriate, allow poor-fit prospects to disqualify, prefer informed no over pressured yes, distinguish observation from inference, protect dignity and autonomy.

THE SIX-LAYER MODEL:
1. Self-Mastery - Assess staff state (rushed, defensive, needy, afraid of price, attached to yes)
2. Observation & Discovery - What's stated vs what changed vs what's missing vs what's assumed
3. Tactical Empathy & Resonance - Labels ("It sounds like..."), Mirrors (repeat key words), Summaries
4. Transparent Framing - What this conversation is for, no-oriented questions, accusation audits (only when evidence supports concern exists)
5. Clear Recommendation - What's appropriate, why, what it requires, cost, expectations, what's NOT guaranteed. Then STOP.
6. Autonomy & Qualification - Problem fit, expectation fit, authority fit, commitment fit, relationship fit. Invite disagreement. Accept informed no.

CONTRADICTION RESOLUTION (when principles conflict):
1. Ethics override wins
2. Discovery over direction
3. Tentative about them (hypotheses they can correct)
4. Certain about us (process, boundaries, fees, recommendations)
5. Silence after moves
6. Evidence before interpretation
7. Safety then directness

CHANNEL RULES:
- Text: 1-3 messages, under 320 chars total, conversational, one question OR one next step
- Email: 3-8 sentences, professional but warm, clear next step
- Verbal: 5-10 talking points (NOT a script), include [TONE], [PAUSE], [LISTEN FOR] markers

OUTPUT: Return valid JSON matching the requested schema. No markdown wrapping around the JSON.`;

const generateInputSchema = z.object({
  channel: z.enum(["text", "email", "verbal"]),
  direction: z.enum(["incoming", "outgoing", "both"]),
  conversation: z.string().min(1),
  context: z.object({
    emotional_tone: z.string(),
    relationship_stage: z.string(),
    desired_outcome: z.string(),
    known_obstacles: z.string(),
    urgency: z.string(),
  }),
  coachMode: z.boolean(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  communication: router({
    generate: publicProcedure
      .input(generateInputSchema)
      .mutation(async ({ input }) => {
        const { channel, direction, conversation, context, coachMode } = input;

        const userPrompt = `CONVERSATION INPUT:
Channel: ${channel}
Direction: ${direction === "incoming" ? "They sent this to us" : direction === "outgoing" ? "We sent this (need feedback)" : "Full thread (both sides)"}

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
  "recommended_response": "The actual ${channel === "verbal" ? "talking points with [TONE: warm/calm/curious] and [PAUSE] and [LISTEN FOR: ...] markers" : channel === "text" ? "text message (short, conversational, under 320 chars)" : "email (3-8 sentences, professional but warm)"}",
  "technique_applied": "One sentence explaining which technique is used and why",
  "what_not_to_say": {"bad_example": "the mistake to avoid", "why": "why it increases resistance"},
  "follow_up_question": "One question if they resist or go silent"${coachMode ? `,
  "coaching": {
    "scores": {"self_mastery": 0-2, "frame_clarity": 0-2, "listening_quality": 0-2, "tactical_empathy": 0-2, "observation_discipline": 0-2, "information_discovery": 0-2, "questions_silence": 0-2, "authority_clarity": 0-2, "autonomy": 0-2, "ethical_influence": 0-2, "qualification": 0-2, "next_step": 0-2},
    "total_score": 0-24,
    "interpretation": "Excellent/Strong/Inconsistent/Rebuild needed",
    "biggest_strength": "exact behavior worth repeating",
    "biggest_leak": "exact moment resistance likely increased",
    "ethics_check": {"status": "PASS or FLAG", "details": "explanation"},
    "best_next_move": {"technique": "technique name", "explanation": "why this is best now"},
    "practice_rep": "one specific role-play challenge"
  }` : ""}
}`;

        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        });

        const content = (llmResponse as any).choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("No response from AI model");
        }

        // Strip markdown code fences if present
        let jsonStr = content.trim();
        if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }

        try {
          return JSON.parse(jsonStr);
        } catch {
          throw new Error("Failed to parse AI response");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
