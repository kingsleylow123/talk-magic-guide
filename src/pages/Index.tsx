import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, FileText, Zap, ArrowRight, Shield, Brain } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [script, setScript] = useState("");
  const navigate = useNavigate();

  const handleStartSession = () => {
    if (!script.trim()) {
      toast.error("Please paste your sales script first");
      return;
    }
    // Store script in sessionStorage for the session page
    sessionStorage.setItem("salesScript", script);
    navigate("/session");
  };

  const exampleScript = `Hi [Name], thanks for taking the time to chat with me today. I know you're busy, so I'll keep this focused.

I've been looking into [Company] and noticed you're dealing with [pain point]. Is that something that's been a challenge for you?

[Listen and acknowledge]

That makes total sense. A lot of our clients were in the same boat before they started using our solution. What we do is [brief value proposition].

The result? Our clients typically see [specific result] within [timeframe].

I'd love to show you exactly how it works. Can we schedule a quick 15-minute demo this week?`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">CloseCoach</span>
          </div>
          <span className="text-sm text-muted-foreground">AI Sales Closing Assistant</span>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-extrabold tracking-tight">
            Close More Deals with{" "}
            <span className="text-gradient-primary">AI-Powered</span> Coaching
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Paste your sales script below. Our AI will guide you through every step 
            and help you handle objections in real time.
          </p>
        </div>

        {/* Features */}
        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: Brain, title: "Smart Script Analysis", desc: "AI breaks down your script into actionable sections" },
            { icon: Mic, title: "Real-Time Coaching", desc: "Get tips and suggestions as you move through your call" },
            { icon: Shield, title: "Objection Handling", desc: "Instant responses to any prospect objection" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border/50 bg-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {/* Script Input */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Your Sales Script</h2>
            </div>
            <button
              onClick={() => setScript(exampleScript)}
              className="text-sm text-primary hover:underline"
            >
              Load example script
            </button>
          </div>
          <Textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your sales script here... The AI will analyze it and guide you through each section during your call."
            className="min-h-[280px] resize-none border-border/50 bg-muted/30 font-mono text-sm leading-relaxed placeholder:text-muted-foreground/50"
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {script.length > 0 ? `${script.split(/\s+/).filter(Boolean).length} words` : "Paste or type your script to get started"}
            </span>
            <Button
              onClick={handleStartSession}
              disabled={!script.trim()}
              className="gap-2 bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              Start Coaching Session
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
