import { useMemo, useState } from "react";
import { ArrowLeft, MessageSquare, Shield, Copy, Loader2, CheckCircle2 } from "lucide-react";
import { generateCommunicationResponse, type GenerateResponse } from "@/lib/api";
import {
  completeDeeplinkHandoff,
  parseDeeplinkSearch,
  type Channel,
  type Direction,
} from "@/lib/deeplink";
import { toast } from "sonner";

export type { Channel, Direction };

function initialFromDeeplink() {
  if (typeof window === "undefined") {
    return parseDeeplinkSearch("");
  }
  return parseDeeplinkSearch(window.location.search);
}

export default function Home() {
  const deeplink = useMemo(() => initialFromDeeplink(), []);

  const [conversation, setConversation] = useState(deeplink.conversation ?? "");
  const [desiredOutcome, setDesiredOutcome] = useState(deeplink.outcome ?? "");
  const [channel, setChannel] = useState<Channel>(deeplink.channel ?? "text");
  const [direction, setDirection] = useState<Direction>(deeplink.direction ?? "incoming");
  const [emotionalTone, setEmotionalTone] = useState(deeplink.tone ?? "");
  const [relationshipStage, setRelationshipStage] = useState(deeplink.stage ?? "");
  const [knownObstacles, setKnownObstacles] = useState(deeplink.obstacles ?? "");
  const [urgency, setUrgency] = useState(deeplink.urgency ?? "");
  const [coachMode, setCoachMode] = useState(deeplink.coachMode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const returnUrl = deeplink.returnUrl;
  const planStepId = deeplink.planStepId;
  const scriptId = deeplink.scriptId;

  const handleGenerate = async () => {
    if (!conversation.trim()) { toast.error("Paste the conversation first"); return; }
    if (!desiredOutcome.trim()) { toast.error("Tell me what you want to happen"); return; }
    setLoading(true);
    setResult(null);
    try {
      const data = await generateCommunicationResponse({
        channel,
        direction,
        conversation,
        context: {
          emotional_tone: emotionalTone,
          relationship_stage: relationshipStage,
          desired_outcome: desiredOutcome,
          known_obstacles: knownObstacles,
          urgency,
        },
        coachMode,
      });
      setResult(data);
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied!");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleReset = () => {
    setConversation("");
    setDesiredOutcome("");
    setResult(null);
    setEmotionalTone("");
    setRelationshipStage("");
    setKnownObstacles("");
    setUrgency("");
  };

  const handleDone = () => {
    if (!returnUrl) {
      toast.error("No return link provided");
      return;
    }
    const handoff = completeDeeplinkHandoff(returnUrl, planStepId);
    if (!handoff.ok) {
      toast.error(handoff.error);
      return;
    }
    window.location.assign(handoff.href);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-tight truncate">Communication Coach</span>
            {scriptId && (
              <span
                className="hidden sm:inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground truncate max-w-[10rem]"
                title={scriptId}
              >
                {scriptId}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {returnUrl && (
              <button
                type="button"
                onClick={handleDone}
                className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-semibold text-foreground hover:opacity-90"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Done
              </button>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ethical Influence</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* PHI Disclaimer */}
        <div className="px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          Do not include patient names, DOB, or protected health information.
        </div>

        {/* Subtitle */}
        <p className="text-base text-muted-foreground">Paste a conversation. Get the right response.</p>

        {/* Main Input Section */}
        {!result && (
          <div className="space-y-5 bg-card rounded-2xl border border-border p-5">

            {/* 1. Paste the conversation */}
            <div className="space-y-2">
              <label className="text-lg font-bold text-foreground">Paste the conversation</label>
              <textarea
                value={conversation}
                onChange={(e) => setConversation(e.target.value)}
                placeholder="Paste the text, email, or describe what was said..."
                rows={5}
                className="w-full rounded-xl bg-background border border-border p-4 text-base text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary"
              />
            </div>

            {/* 2. What do you want to happen? */}
            <div className="space-y-2">
              <label className="text-lg font-bold text-foreground">What do you want to happen?</label>
              <input
                value={desiredOutcome}
                onChange={(e) => setDesiredOutcome(e.target.value)}
                placeholder="e.g., Get them scheduled, handle price objection, get them back in..."
                className="w-full rounded-xl bg-background border border-border p-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* 3. Quick toggles */}
            <div className="flex gap-4 flex-wrap">
              <div className="space-y-1">
                <span className="text-sm font-semibold text-muted-foreground">Type</span>
                <div className="flex gap-2">
                  {(["text", "email", "verbal"] as const).map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setChannel(ch)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
                        channel === ch ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-muted-foreground">Who sent it?</span>
                <div className="flex gap-2">
                  {([
                    { key: "incoming" as const, label: "They did" },
                    { key: "outgoing" as const, label: "I did" },
                    { key: "both" as const, label: "Both" },
                  ]).map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setDirection(d.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        direction === d.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Extra context — always visible */}
            <p className="text-base font-bold text-foreground">Extra context (optional)</p>

            <div className="space-y-3 pl-2 border-l-2 border-primary/30">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-muted-foreground">Their tone</label>
                    <select value={emotionalTone} onChange={(e) => setEmotionalTone(e.target.value)} className="w-full rounded-lg bg-background border border-border p-2 text-sm text-foreground">
                      <option value="">Not sure</option>
                      <option value="frustrated">Frustrated</option>
                      <option value="anxious">Anxious</option>
                      <option value="skeptical">Skeptical</option>
                      <option value="curious">Curious</option>
                      <option value="angry">Angry</option>
                      <option value="neutral">Neutral</option>
                      <option value="excited">Excited</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-muted-foreground">Who are they?</label>
                    <select value={relationshipStage} onChange={(e) => setRelationshipStage(e.target.value)} className="w-full rounded-lg bg-background border border-border p-2 text-sm text-foreground">
                      <option value="">Not sure</option>
                      <option value="cold_lead">Cold lead</option>
                      <option value="new_lead">New inquiry</option>
                      <option value="scheduled">Scheduled, not seen</option>
                      <option value="active_patient">Active patient</option>
                      <option value="inactive_patient">Dropped off</option>
                      <option value="referral_source">Referral source</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-muted-foreground">Known obstacles</label>
                  <input value={knownObstacles} onChange={(e) => setKnownObstacles(e.target.value)} placeholder="price, time, spouse, scared..." className="w-full rounded-lg bg-background border border-border p-2 text-sm text-foreground placeholder:text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="text-sm font-bold text-foreground">Coach Me</p>
                    <p className="text-xs text-muted-foreground">Score my communication</p>
                  </div>
                  <button onClick={() => setCoachMode(!coachMode)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${coachMode ? "bg-primary text-primary-foreground" : "bg-border text-muted-foreground"}`}>
                    {coachMode ? "ON" : "OFF"}
                  </button>
                </div>
              </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground text-lg font-bold hover:opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Thinking...</> : "Get Response"}
            </button>

            {returnUrl && (
              <button
                type="button"
                onClick={handleDone}
                className="w-full py-3 rounded-xl bg-muted text-foreground text-base font-semibold hover:opacity-80 transition-colors inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Done — back to plan
              </button>
            )}
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="space-y-5">

            {/* Situation Read — compact */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <p className="text-sm font-bold text-primary uppercase tracking-wide mb-1">What's happening</p>
              <p className="text-base text-foreground leading-relaxed">{result.situation_read}</p>
            </div>

            {/* THE RESPONSE — the main output, prominent */}
            <div className="bg-card rounded-2xl border-2 border-primary/50 p-5 space-y-4">
              <p className="text-sm font-bold text-green-400 uppercase tracking-wide">Your Response — Copy & Send</p>
              <pre className="whitespace-pre-wrap text-lg text-foreground font-sans leading-relaxed">
                {result.recommended_response}
              </pre>
              <button
                onClick={() => handleCopy(result.recommended_response)}
                className="w-full py-3 rounded-xl bg-blue-600 text-white text-base font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <><CheckCircle2 className="w-5 h-5" /> Copied!</> : <><Copy className="w-5 h-5" /> Copy Response</>}
              </button>
            </div>

            {/* What they're protecting */}
            {result.protecting.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-4">
                <p className="text-sm font-bold text-yellow-400 uppercase tracking-wide mb-2">What they're protecting</p>
                {result.protecting.map((p, i) => (
                  <p key={i} className="text-base text-foreground">• {p}</p>
                ))}
              </div>
            )}

            {/* Technique */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <p className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-1">Why this works</p>
              <p className="text-base text-foreground">{result.technique_applied}</p>
            </div>

            {/* What NOT to say */}
            {result.what_not_to_say?.bad_example && (
              <div className="bg-destructive/10 rounded-2xl border border-destructive/30 p-4">
                <p className="text-sm font-bold text-destructive uppercase tracking-wide mb-1">Don't say this</p>
                <p className="text-base text-destructive/80 italic">"{result.what_not_to_say.bad_example}"</p>
                <p className="text-sm text-destructive/70 mt-1">{result.what_not_to_say.why}</p>
              </div>
            )}

            {/* Follow-up */}
            {result.follow_up_question && (
              <div className="bg-card rounded-2xl border border-border p-4">
                <p className="text-sm font-bold text-orange-400 uppercase tracking-wide mb-1">If they go silent</p>
                <p className="text-base text-foreground">"{result.follow_up_question}"</p>
              </div>
            )}

            {/* Coach Mode Scorecard */}
            {result.coaching && (
              <div className="bg-primary/10 rounded-2xl border border-primary/30 p-5 space-y-3">
                <p className="text-sm font-bold text-primary uppercase tracking-wide">Your Scorecard</p>
                <p className="text-xl font-bold text-foreground">{result.coaching.total_score}/24 — {result.coaching.interpretation}</p>
                <p className="text-base text-green-400">✓ Strength: {result.coaching.biggest_strength}</p>
                <p className="text-base text-destructive">✗ Leak: {result.coaching.biggest_leak}</p>
                {result.coaching.practice_rep && (
                  <p className="text-base text-primary">Practice: {result.coaching.practice_rep}</p>
                )}
              </div>
            )}

            {/* Start Over / Done */}
            <div className="space-y-3">
              {returnUrl && (
                <button
                  type="button"
                  onClick={handleDone}
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground text-lg font-bold hover:opacity-90 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Done — back to plan
                </button>
              )}
              <button
                onClick={handleReset}
                className="w-full py-4 rounded-xl bg-muted text-foreground text-lg font-bold hover:opacity-80 transition-colors"
              >
                New Conversation
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
