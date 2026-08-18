import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Mail, Phone, ArrowRight } from "lucide-react";
import type { Channel, Direction, ConversationData } from "@/pages/Home";

interface Props {
  onSubmit: (data: ConversationData) => void;
}

export function ConversationInput({ onSubmit }: Props) {
  const [channel, setChannel] = useState<Channel>("text");
  const [direction, setDirection] = useState<Direction>("incoming");
  const [conversation, setConversation] = useState("");

  const handleSubmit = () => {
    if (!conversation.trim()) return;
    onSubmit({ channel, direction, conversation: conversation.trim() });
  };

  const channelOptions = [
    { value: "text", label: "Text Message", icon: MessageSquare, desc: "SMS or messaging app" },
    { value: "email", label: "Email", icon: Mail, desc: "Professional email" },
    { value: "verbal", label: "Verbal", icon: Phone, desc: "Describe what was said" },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Channel Selection */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5 block">
          Communication Channel
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {channelOptions.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              onClick={() => setChannel(value)}
              className={`p-3 rounded-xl border text-left transition-all duration-150 active:scale-[0.97] ${
                channel === value
                  ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                  : "border-border hover:border-primary/40 hover:bg-accent/50"
              }`}
            >
              <Icon className={`w-4 h-4 mb-1.5 ${channel === value ? "text-primary" : "text-muted-foreground"}`} />
              <div className={`text-sm font-medium ${channel === value ? "text-primary" : "text-foreground"}`}>{label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Direction */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5 block">
          Direction
        </label>
        <Select value={direction} onValueChange={(v) => setDirection(v as Direction)}>
          <SelectTrigger className="bg-input border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="incoming">Incoming — They sent this to us</SelectItem>
            <SelectItem value="outgoing">Outgoing — We sent this, need feedback</SelectItem>
            <SelectItem value="both">Both sides — Full conversation thread</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conversation Input */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5 block">
          {channel === "verbal" ? "Describe what happened" : "Paste the conversation"}
        </label>
        <Card className="bg-input border-border overflow-hidden">
          <CardContent className="p-0">
            <Textarea
              value={conversation}
              onChange={(e) => setConversation(e.target.value)}
              placeholder={
                channel === "verbal"
                  ? "Describe the conversation: who said what, their tone, how they responded, what happened..."
                  : channel === "text"
                  ? "Paste the text message thread here..."
                  : "Paste the email content here..."
              }
              className="min-h-[180px] border-0 bg-transparent resize-none focus-visible:ring-0 text-sm leading-relaxed"
            />
          </CardContent>
        </Card>
        <div className="flex justify-between items-center mt-2">
          <span className="text-[11px] text-muted-foreground">
            {conversation.length > 0 ? `${conversation.length} characters` : ""}
          </span>
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!conversation.trim()}
        className="w-full h-11 text-sm font-medium gap-2 transition-all duration-150 active:scale-[0.97]"
      >
        Continue to Context
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
