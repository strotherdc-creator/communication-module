import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Brain } from "lucide-react";

interface CoachingData {
  scores: Record<string, number>;
  total_score: number;
  interpretation: string;
  biggest_strength: string;
  biggest_leak: string;
  ethics_check: { status: string; details: string };
  best_next_move: { technique: string; explanation: string };
  practice_rep: string;
}

interface Props {
  coaching: CoachingData;
}

const scoreLabels: Record<string, string> = {
  self_mastery: "Self-Mastery",
  frame_clarity: "Frame Clarity",
  listening_quality: "Listening",
  tactical_empathy: "Empathy",
  observation_discipline: "Observation",
  information_discovery: "Discovery",
  questions_silence: "Questions & Silence",
  authority_clarity: "Authority",
  autonomy: "Autonomy",
  ethical_influence: "Ethics",
  qualification: "Qualification",
  next_step: "Next Step",
};

export function CoachingFeedback({ coaching }: Props) {
  return (
    <>
      <Separator className="my-6" />
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Coaching Feedback</h3>
      </div>

      {/* Scorecard */}
      <Card className="bg-card border-border mb-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Score: {coaching.total_score}/24 — {coaching.interpretation}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(coaching.scores).map(([key, score]) => (
              <div key={key} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                <span className="text-xs text-muted-foreground">{scoreLabels[key] || key}</span>
                <span className={`text-xs font-bold ${
                  score === 2 ? "text-green-400" : score === 1 ? "text-yellow-400" : "text-destructive"
                }`}>
                  {score}/2
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strength & Leak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <Card className="bg-card border-green-500/20">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-green-400 uppercase tracking-wider">Biggest Strength</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{coaching.biggest_strength}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-destructive/20">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-destructive uppercase tracking-wider">Biggest Leak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{coaching.biggest_leak}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ethics Check */}
      <Card className={`bg-card mb-3 ${coaching.ethics_check.status === "PASS" ? "border-green-500/20" : "border-destructive/40"}`}>
        <CardHeader className="pb-1">
          <CardTitle className={`text-xs font-medium uppercase tracking-wider ${
            coaching.ethics_check.status === "PASS" ? "text-green-400" : "text-destructive"
          }`}>
            Ethics Check: {coaching.ethics_check.status}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{coaching.ethics_check.details}</p>
        </CardContent>
      </Card>

      {/* Best Next Move */}
      <Card className="bg-card border-primary/20 mb-3">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium text-primary uppercase tracking-wider">
            Best Next Move: {coaching.best_next_move.technique}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{coaching.best_next_move.explanation}</p>
        </CardContent>
      </Card>

      {/* Practice Rep */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Practice Rep</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{coaching.practice_rep}</p>
        </CardContent>
      </Card>
    </>
  );
}
