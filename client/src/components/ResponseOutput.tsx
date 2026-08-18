import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, RotateCcw, Brain, Shield, AlertTriangle, Target, HelpCircle, XCircle, Loader2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import { CoachingFeedback } from "./CoachingFeedback";
import type { ConversationData, ContextData } from "@/pages/Home";

interface Props {
  conversationData: ConversationData;
  contextData: ContextData;
  coachMode: boolean;
  onCoachModeToggle: () => void;
  onReset: () => void;
}

interface LLMResponse {
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

export function ResponseOutput({ conversationData, contextData, coachMode, onCoachModeToggle, onReset }: Props) {
  const [copied, setCopied] = useState(false);
  const [response, setResponse] = useState<LLMResponse | null>(null);
  const [lastCoachMode, setLastCoachMode] = useState(coachMode);

  const generateMutation = trpc.communication.generate.useMutation({
    onSuccess: (data) => {
      setResponse(data as LLMResponse);
    },
  });

  const runGeneration = useCallback((withCoachMode: boolean) => {
    generateMutation.mutate({
      channel: conversationData.channel,
      direction: conversationData.direction,
      conversation: conversationData.conversation,
      context: contextData,
      coachMode: withCoachMode,
    });
  }, [conversationData, contextData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial generation
  useEffect(() => {
    runGeneration(coachMode);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-run when coach mode is toggled (only if it changed and we need coaching data)
  useEffect(() => {
    if (coachMode !== lastCoachMode) {
      setLastCoachMode(coachMode);
      if (coachMode && !response?.coaching) {
        // Need to re-generate with coaching enabled
        runGeneration(true);
      }
    }
  }, [coachMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = async () => {
    if (!response?.recommended_response) return;
    await navigator.clipboard.writeText(response.recommended_response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (generateMutation.isPending || !response) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <div className="text-sm text-muted-foreground">Analyzing conversation and generating response...</div>
        <div className="text-xs text-muted-foreground/60">Applying ethical influence methodology</div>
      </div>
    );
  }

  if (generateMutation.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
        <div className="text-sm text-destructive">Failed to generate response</div>
        <div className="text-xs text-muted-foreground">{generateMutation.error.message}</div>
        <Button variant="outline" onClick={onReset} className="mt-2 gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          Start Over
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Coach Mode Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Coach Me Mode</span>
          <span className="text-xs text-muted-foreground">— get feedback on your original message</span>
        </div>
        <Switch checked={coachMode} onCheckedChange={onCoachModeToggle} />
      </div>

      {/* Situation Read */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Situation Read
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{response.situation_read}</p>
        </CardContent>
      </Card>

      {/* What They May Be Protecting */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            What They May Be Protecting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {response.protecting.map((item, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {item}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Missing Information */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Missing Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {response.missing_info.map((item, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">?</span>
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* RECOMMENDED RESPONSE - Primary deliverable */}
      <Card className="bg-card border-primary/30 border-2 shadow-lg shadow-primary/5">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">
            Recommended Response
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2.5 text-xs gap-1.5 hover:bg-primary/10"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <Streamdown>{response.recommended_response}</Streamdown>
          </div>
          <div className="mt-3 text-xs text-muted-foreground italic">
            {response.technique_applied}
          </div>
        </CardContent>
      </Card>

      {/* What NOT to Say */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-destructive/80 uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            What NOT to Say
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 mb-2">
            <p className="text-sm text-destructive/90 font-mono">"{response.what_not_to_say.bad_example}"</p>
          </div>
          <p className="text-xs text-muted-foreground">{response.what_not_to_say.why}</p>
        </CardContent>
      </Card>

      {/* Follow-Up Question */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            If They Resist or Go Silent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm italic text-foreground/90">"{response.follow_up_question}"</p>
        </CardContent>
      </Card>

      {/* Coaching Section */}
      {coachMode && response.coaching && (
        <CoachingFeedback coaching={response.coaching} />
      )}

      {/* Reset */}
      <div className="pt-4">
        <Button variant="outline" onClick={onReset} className="w-full gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          New Conversation
        </Button>
      </div>
    </div>
  );
}
