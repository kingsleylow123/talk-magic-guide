import { useState } from "react";
import { X, Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { streamCoach } from "@/lib/sales-coach";
import { toast } from "sonner";

interface Props {
  currentSection: string;
  onClose: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ObjectionPanel = ({ currentSection, onClose }: Props) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const objection = input.trim();
    setInput("");
    const userMsg: Message = { role: "user", content: objection };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantText = "";
    const updateAssistant = (chunk: string) => {
      assistantText += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantText } : m));
        }
        return [...prev, { role: "assistant", content: assistantText }];
      });
    };

    try {
      await streamCoach({
        body: {
          mode: "handle_objection",
          objection,
          currentSection,
          conversationContext: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
        },
        onDelta: updateAssistant,
        onDone: () => setIsLoading(false),
        onError: (err) => {
          toast.error(err);
          setIsLoading(false);
        },
      });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-96 flex-col border-l border-border/50 bg-card animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-destructive" />
          <span className="font-semibold">Objection Handler</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Type the prospect's objection and get an instant response
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`${msg.role === "user" ? "ml-8" : "mr-4"}`}>
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary/10 text-foreground"
                  : "border border-border/50 bg-muted/30"
              }`}
            >
              {msg.role === "assistant" && (
                <span className="mb-1 block text-xs font-medium text-primary">AI Coach</span>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border/50 p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What did they say?"
            className="border-border/50 bg-muted/30 text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isLoading}
            className="bg-primary px-3 text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ObjectionPanel;
