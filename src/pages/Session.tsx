import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ArrowLeft, ChevronRight, ChevronLeft, MessageSquare, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ObjectionPanel from "@/components/ObjectionPanel";
import CoachingTip from "@/components/CoachingTip";
import { analyzeScript, streamCoach } from "@/lib/sales-coach";

interface ScriptSection {
  title: string;
  content: string;
  tone: string;
  tips: string;
}

const Session = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState<ScriptSection[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [showObjection, setShowObjection] = useState(false);
  const [coachingTip, setCoachingTip] = useState("");
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const rawScript = sessionStorage.getItem("salesScript") || "";

  useEffect(() => {
    if (!rawScript) {
      navigate("/");
      return;
    }
    loadScript();
  }, []);

  const loadScript = async () => {
    try {
      const result = await analyzeScript(rawScript);
      // Try to parse JSON from the result
      let parsed: ScriptSection[];
      try {
        // Remove potential markdown code blocks
        const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        // Fallback: create sections from raw script
        const paragraphs = rawScript.split("\n\n").filter(Boolean);
        parsed = paragraphs.map((p, i) => ({
          title: `Section ${i + 1}`,
          content: p.trim(),
          tone: "confident",
          tips: "Speak clearly and maintain eye contact.",
        }));
      }
      setSections(parsed);
    } catch (err) {
      toast.error("Failed to analyze script. Using raw sections.");
      const paragraphs = rawScript.split("\n\n").filter(Boolean);
      setSections(paragraphs.map((p, i) => ({
        title: `Section ${i + 1}`,
        content: p.trim(),
        tone: "confident",
        tips: "Speak clearly and with conviction.",
      })));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const goNext = () => {
    if (currentIndex < sections.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCoachingTip("");
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCoachingTip("");
    }
  };

  const getCoachingTip = useCallback(async () => {
    if (!sections[currentIndex]) return;
    setIsLoadingTip(true);
    setCoachingTip("");
    try {
      await streamCoach({
        body: {
          mode: "coaching_tip",
          currentSection: sections[currentIndex].content,
          conversationContext: `Section: ${sections[currentIndex].title}`,
        },
        onDelta: (chunk) => setCoachingTip((prev) => prev + chunk),
        onDone: () => setIsLoadingTip(false),
        onError: (err) => {
          toast.error(err);
          setIsLoadingTip(false);
        },
      });
    } catch {
      setIsLoadingTip(false);
    }
  }, [currentIndex, sections]);

  if (isAnalyzing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Analyzing your script...</h2>
        <p className="mt-2 text-muted-foreground">Breaking it down into actionable coaching sections</p>
      </div>
    );
  }

  const current = sections[currentIndex];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-semibold">Live Session</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Section {currentIndex + 1} of {sections.length}
            </span>
            <div className="flex gap-1">
              {sections.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentIndex(i); setCoachingTip(""); }}
                  className={`h-2 w-2 rounded-full transition-all ${
                    i === currentIndex ? "w-6 bg-primary" : i < currentIndex ? "bg-primary/40" : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Script Panel */}
        <div className="flex flex-1 flex-col p-6">
          <div className="mx-auto w-full max-w-3xl flex-1">
            {/* Section Header */}
            <div className="mb-6 animate-fade-in-up">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {current?.tone?.toUpperCase()}
                </span>
                <span className="text-sm text-muted-foreground">
                  Step {currentIndex + 1}
                </span>
              </div>
              <h2 className="text-2xl font-bold">{current?.title}</h2>
            </div>

            {/* Script Content - Teleprompter Style */}
            <div className="mb-6 rounded-xl border border-border/50 bg-card p-8 shadow-lg animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <p className="whitespace-pre-wrap text-lg leading-relaxed">
                {current?.content}
              </p>
            </div>

            {/* Tips */}
            <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-accent">
                <Lightbulb className="h-4 w-4" />
                Delivery Tips
              </div>
              <p className="text-sm text-muted-foreground">{current?.tips}</p>
            </div>

            {/* AI Coaching Tip */}
            <CoachingTip
              tip={coachingTip}
              isLoading={isLoadingTip}
              onRequest={getCoachingTip}
            />
          </div>

          {/* Navigation */}
          <div className="mx-auto mt-6 flex w-full max-w-3xl items-center justify-between">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={() => setShowObjection(true)}
              variant="outline"
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <MessageSquare className="h-4 w-4" />
              Handle Objection
            </Button>
            <Button
              onClick={goNext}
              disabled={currentIndex === sections.length - 1}
              className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Objection Panel */}
        {showObjection && (
          <ObjectionPanel
            currentSection={current?.content || ""}
            onClose={() => setShowObjection(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Session;
