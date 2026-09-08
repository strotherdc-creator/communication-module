/**
 * Synapse → Communication Coach deep-link contract (v1).
 * Entry: `/` + query params. Separate SPA; no embed/proxy required.
 */

export type Channel = "text" | "email" | "verbal";
export type Direction = "incoming" | "outgoing" | "both";

const CHANNELS = new Set<Channel>(["text", "email", "verbal"]);
const DIRECTIONS = new Set<Direction>(["incoming", "outgoing", "both"]);

function truthyFlag(raw: string | null): boolean {
  if (!raw) return false;
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function pickEnum<T extends string>(raw: string | null, allowed: Set<T>): T | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase() as T;
  return allowed.has(v) ? v : undefined;
}

/** Only absolute https URLs — blocks javascript:/data:/http:/relative. */
export function parseSafeReturnUrl(raw: string | null | undefined): URL | null {
  if (!raw || !raw.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export interface DeeplinkPrefill {
  conversation?: string;
  outcome?: string;
  channel?: Channel;
  direction?: Direction;
  tone?: string;
  stage?: string;
  obstacles?: string;
  urgency?: string;
  coachMode: boolean;
  scriptId?: string;
  planStepId?: string;
  returnUrl: URL | null;
  /** True when any advanced context field was supplied. */
  hasAdvanced: boolean;
}

export function parseDeeplinkSearch(search: string): DeeplinkPrefill {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);

  const conversation = params.get("conversation")?.trim() || undefined;
  const outcome = params.get("outcome")?.trim() || undefined;
  const channel = pickEnum(params.get("channel"), CHANNELS);
  const direction = pickEnum(params.get("direction"), DIRECTIONS);
  const tone = params.get("tone")?.trim() || undefined;
  const stage = params.get("stage")?.trim() || undefined;
  const obstacles = params.get("obstacles")?.trim() || undefined;
  const urgency = params.get("urgency")?.trim() || undefined;
  const coachMode =
    truthyFlag(params.get("coach")) || truthyFlag(params.get("coachMode"));
  const scriptId = params.get("scriptId")?.trim() || undefined;
  const planStepId = params.get("planStepId")?.trim() || undefined;
  const returnUrl = parseSafeReturnUrl(params.get("returnUrl"));

  const hasAdvanced = Boolean(tone || stage || obstacles || urgency || coachMode);

  return {
    conversation,
    outcome,
    channel,
    direction,
    tone,
    stage,
    obstacles,
    urgency,
    coachMode,
    scriptId,
    planStepId,
    returnUrl,
    hasAdvanced,
  };
}

/** Append commCoach=done (+ planStepId) onto a validated https return URL. */
export function buildDoneReturnUrl(returnUrl: URL, planStepId?: string): string {
  const url = new URL(returnUrl.toString());
  url.searchParams.set("commCoach", "done");
  if (planStepId) url.searchParams.set("planStepId", planStepId);
  return url.toString();
}

export type CompleteHandoffResult =
  | { ok: true; href: string }
  | { ok: false; error: string };

/**
 * postMessage to opener (if any) then return href for redirect.
 * targetOrigin is always returnUrl.origin — never "*".
 */
export function completeDeeplinkHandoff(
  returnUrl: URL,
  planStepId?: string,
  opener: Window | null = typeof window !== "undefined" ? window.opener : null
): CompleteHandoffResult {
  if (returnUrl.protocol !== "https:") {
    return { ok: false, error: "Return link must be https" };
  }
  const href = buildDoneReturnUrl(returnUrl, planStepId);
  try {
    opener?.postMessage(
      { type: "comm-coach-complete", planStepId: planStepId ?? null },
      returnUrl.origin
    );
  } catch {
    // Ignore cross-origin / missing opener
  }
  return { ok: true, href };
}
