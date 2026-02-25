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
    sessionStorage.setItem("salesScript", script);
    navigate("/session");
  };

  const exampleScript = `Great, so what made you decide to schedule this appointment with me?

[Ask these 5 consultation questions and dig deep:]

1. What is the result you would like to achieve?
2. What is your current situation? (Around how much are you making? $0-$2k, $2k-$5k, $5k-$10k, or more?)
3. What is the biggest pain about staying in your current situation?
4. What are the obstacles preventing you from getting to your desired result?
5. On a scale of 1 to 10, how willing are you to get to your desired result?

[If 7/10 and above, proceed to pitch:]

Based on what you said, I know the perfect solution to help you! Shall I share it with you?

[Recap consultation questions - make them say "yes, yes, yes":]

Just now you mentioned you wanted [Result] correct? And you mentioned you are currently [current situation] correct? And your main obstacles are [obstacles] correct? And your biggest pain is [pain] correct?

Okay based on what you said, I have the perfect solution just for you.

[Deal or No Deal pre-frame:]

Ok so here's how I normally like to do my calls. I will explain to you everything I have to offer, and how it can help you. You can ask me any questions. By the end of this call, I would want you to make a decision. Either a "Yes" or a "No". If it's a "Yes", great! If it's a "No", that's fine. If you really need to think about it, you can put in a refundable deposit. Is that ok?

[Present the solution:]

So I have this [product/service] that helps you to [benefit]. It consists of: [list components]

And this will potentially help you get from [current situation] to [desired situation] and overcome [obstacles].

[Qualification questions - let THEM sell YOU:]

Do you feel that this will be able to help you? How do you feel it can help you?

[Handle logistics before price:]

Are you able to make a decision on your own? If this is the right fit, can you start now? Is there anything else that can potentially stop you from doing this?

[Reveal price only when 80% sure they'll buy:]

Ok great, based on what you are telling me, I think this would be the right fit for you. And the reason why is because I like that [praise them]. So do you want to enrol?

This [product] is going to be $[price]. Are you okay with that?

[Collect payment on the call. Embrace the silence while they transfer.]

[Build rapport before ending - whether closed or not:]

Ok so I'm just going to give you a quick action plan. Did you get value? Great! Have a nice day ahead!`;

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
