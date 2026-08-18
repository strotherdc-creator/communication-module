import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Zap } from "lucide-react";
import type { ConversationData, ContextData } from "@/pages/Home";

interface Props {
  conversationData: ConversationData;
  onSubmit: (data: ContextData) => void;
  onBack: () => void;
}

export function ContextGathering({ conversationData, onSubmit, onBack }: Props) {
  const [tone, setTone] = useState("");
  const [stage, setStage] = useState("");
  const [outcome, setOutcome] = useState("");
  const [obstacles, setObstacles] = useState("");
  const [urgency, setUrgency] = useState("");

  const handleSubmit = () => {
    if (!outcome.trim()) return;
    onSubmit({
      emotional_tone: tone,
      relationship_stage: stage,
      desired_outcome: outcome.trim(),
      known_obstacles: obstacles.trim(),
      urgency,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">Quick Context</h2>
        <span className="text-xs text-muted-foreground ml-1">— helps generate a better response</span>
      </div>

      {/* Preview of what they entered */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">
          {conversationData.channel === "text" ? "Text" : conversationData.channel === "email" ? "Email" : "Verbal"} •{" "}
          {conversationData.direction === "incoming" ? "They sent" : conversationData.direction === "outgoing" ? "We sent" : "Full thread"}
        </span>
        <span className="ml-2">— {conversationData.conversation.slice(0, 80)}...</span>
      </div>

      {/* Emotional Tone */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          Their Emotional Tone
        </label>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="bg-input border-border">
            <SelectValue placeholder="Select perceived tone..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="frustrated">Frustrated</SelectItem>
            <SelectItem value="skeptical">Skeptical</SelectItem>
            <SelectItem value="hopeful">Hopeful</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="confused">Confused</SelectItem>
            <SelectItem value="defensive">Defensive</SelectItem>
            <SelectItem value="eager">Eager</SelectItem>
            <SelectItem value="anxious">Anxious</SelectItem>
            <SelectItem value="cold">Cold / Distant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Relationship Stage */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          Relationship Stage
        </label>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="bg-input border-border">
            <SelectValue placeholder="Where are they in the journey?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new_lead">New Lead / First Contact</SelectItem>
            <SelectItem value="existing_patient">Existing Patient</SelectItem>
            <SelectItem value="reactivation">Reactivation (lapsed patient)</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="inquiry">Walk-in / Phone Inquiry</SelectItem>
            <SelectItem value="post_consult">Post-Consultation Follow-up</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desired Outcome - REQUIRED */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          Your Desired Outcome <span className="text-destructive">*</span>
        </label>
        <Input
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="e.g., Get them to schedule the consultation"
          className="bg-input border-border"
        />
      </div>

      {/* Known Obstacles */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          Known Obstacles <span className="text-muted-foreground/60">(keywords)</span>
        </label>
        <Input
          value={obstacles}
          onChange={(e) => setObstacles(e.target.value)}
          placeholder="e.g., price, spouse approval, time, skepticism"
          className="bg-input border-border"
        />
      </div>

      {/* Urgency */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          Urgency / Timeline
        </label>
        <Select value={urgency} onValueChange={setUrgency}>
          <SelectTrigger className="bg-input border-border">
            <SelectValue placeholder="How soon do they need to act?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">Immediate — respond now</SelectItem>
            <SelectItem value="this_week">This week</SelectItem>
            <SelectItem value="exploring">Exploring — no rush</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!outcome.trim()}
          className="flex-1 h-11 text-sm font-medium gap-2 transition-all duration-150 active:scale-[0.97]"
        >
          Generate Response
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
