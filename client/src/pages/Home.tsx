import { useState } from "react";
import { ConversationInput } from "@/components/ConversationInput";
import { ContextGathering } from "@/components/ContextGathering";
import { ResponseOutput } from "@/components/ResponseOutput";
import { MessageSquare, Shield } from "lucide-react";

export type Channel = "text" | "email" | "verbal";
export type Direction = "incoming" | "outgoing" | "both";
export type Step = "input" | "context" | "output";

export interface ConversationData {
  channel: Channel;
  direction: Direction;
  conversation: string;
}

export interface ContextData {
  emotional_tone: string;
  relationship_stage: string;
  desired_outcome: string;
  known_obstacles: string;
  urgency: string;
}

export default function Home() {
  const [step, setStep] = useState<Step>("input");
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const [coachMode, setCoachMode] = useState(false);

  const handleConversationSubmit = (data: ConversationData) => {
    setConversationData(data);
    setStep("context");
  };

  const handleContextSubmit = (data: ContextData) => {
    setContextData(data);
    setStep("output");
  };

  const handleReset = () => {
    setStep("input");
    setConversationData(null);
    setContextData(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Communication Coach</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>Ethical Influence</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* PHI Disclaimer */}
        <div className="mb-6 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          Do not include full patient names, dates of birth, or protected health information.
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {["Input", "Context", "Response"].map((label, i) => {
            const stepIndex = i;
            const currentIndex = step === "input" ? 0 : step === "context" ? 1 : 2;
            const isActive = stepIndex === currentIndex;
            const isComplete = stepIndex < currentIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className={`w-8 h-px ${isComplete ? "bg-primary" : "bg-border"}`} />}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive ? "bg-primary/20 text-primary" : isComplete ? "bg-primary/10 text-primary/70" : "bg-muted text-muted-foreground"
                }`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? "bg-primary text-primary-foreground" : isComplete ? "bg-primary/60 text-primary-foreground" : "bg-muted-foreground/30 text-muted-foreground"
                  }`}>
                    {isComplete ? "✓" : i + 1}
                  </span>
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Content */}
        {step === "input" && (
          <ConversationInput onSubmit={handleConversationSubmit} />
        )}
        {step === "context" && conversationData && (
          <ContextGathering
            conversationData={conversationData}
            onSubmit={handleContextSubmit}
            onBack={() => setStep("input")}
          />
        )}
        {step === "output" && conversationData && contextData && (
          <ResponseOutput
            conversationData={conversationData}
            contextData={contextData}
            coachMode={coachMode}
            onCoachModeToggle={() => setCoachMode(!coachMode)}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}

