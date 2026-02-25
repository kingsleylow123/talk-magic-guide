import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ArrowLeft, ChevronRight, ChevronLeft, Lightbulb, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ObjectionPanel from "@/components/ObjectionPanel";
import CoachingTip from "@/components/CoachingTip";
import AudioControls from "@/components/AudioControls";
import LiveTranscript from "@/components/LiveTranscript";
import type { TranscriptEntry } from "@/components/LiveTranscript";
import { analyzeScript, streamCoach } from "@/lib/sales-coach";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import type { Speaker } from "@/hooks/use-speech-recognition";

import type { ScriptSection } from "@/lib/script-template";

// Keywords that indicate objections
const OBJECTION_KEYWORDS = [
  "too expensive", "can't afford", "not sure", "think about it", "talk to my",
  "no money", "not interested", "too much", "competitor", "already have",
  "don't need", "not right now", "later", "let me think", "spouse",
  "partner", "budget", "price is", "cost too", "waste of money",
  "scam", "doesn't work", "not for me", "i don't know",
];

function detectObjection(text: string): boolean {
  const lower = text.toLowerCase();
  return OBJECTION_KEYWORDS.some((kw) => lower.includes(kw));
}

/** Extract significant words from a section for matching against speech */
function extractKeywords(text: string): string[] {
  const stopWords = new Set(["the","a","an","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","shall","should","may","might","must","can","could","and","but","or","nor","for","yet","so","in","on","at","to","from","by","with","of","that","this","it","its","i","you","we","they","he","she","my","your","our","their","me","us","him","her","them","what","which","who","whom","whose","how","when","where","why","if","then","than","as","not","no","just","also","very","too","really","about","into","over","after","before","up","down","out","off","all","each","every","both","few","more","most","other","some","any","such","only","same","here","there","again","once","ok","okay","so","um","uh","like","right","well","now","let","want","going","get","got","put","say","said","tell","told","know","think","see","look","come","go","make","take","give","keep","find","need","feel","try","leave","call","start","end"]);
  return text
    .toLowerCase()
    .replace(/\[.*?\]/g, "") // remove stage directions
    .split(/\W+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

/** Check how many keywords from a section have been spoken */
function matchScore(sectionKeywords: string[], spokenText: string): number {
  if (sectionKeywords.length === 0) return 0;
  const spokenLower = spokenText.toLowerCase();
  const matched = sectionKeywords.filter((kw) => spokenLower.includes(kw));
  return matched.length / sectionKeywords.length;
}

const Session = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState<ScriptSection[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [showObjection, setShowObjection] = useState(false);
  const [coachingTip, setCoachingTip] = useState("");
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [liveCoachResponse, setLiveCoachResponse] = useState("");
  const [isLiveCoaching, setIsLiveCoaching] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const scriptMode = sessionStorage.getItem("scriptMode") || "pasted";
  const rawScript = sessionStorage.getItem("salesScript") || "";
  const preBuiltSections = sessionStorage.getItem("scriptSections");
  const coachDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentTranscriptRef = useRef("");
  const sectionTranscriptRef = useRef(""); // accumulates transcript for the current section
  const sectionKeywordsRef = useRef<string[]>([]);

  // Accumulate recent transcript text for context
  const handleTranscript = useCallback((text: string, isFinal: boolean, speaker: Speaker) => {
    if (!isFinal) return;

    const isObjection = detectObjection(text);
    setTranscriptEntries((prev) => [
      ...prev,
      { text, timestamp: Date.now(), isObjection, speaker },
    ]);

    recentTranscriptRef.current += " " + text;
    sectionTranscriptRef.current += " " + text;

    // Auto-advance: check if enough of the current section has been covered
    if (autoAdvance && sectionKeywordsRef.current.length > 0) {
      const score = matchScore(sectionKeywordsRef.current, sectionTranscriptRef.current);
      if (score >= 0.25) {
        // User has covered ~25% of section keywords — they're through this part
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next < sections.length) {
            sectionTranscriptRef.current = "";
            setCoachingTip("");
            setLiveCoachResponse("");
            return next;
          }
          return prev;
        });
      }
    }

    // If objection detected, auto-open the objection panel
    if (isObjection) {
      setShowObjection(true);
      toast("Objection detected!", {
        description: text,
        icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
      });
    }

    // Debounce live coaching — every 5 seconds of accumulated speech
    if (coachDebounceRef.current) clearTimeout(coachDebounceRef.current);
    coachDebounceRef.current = setTimeout(() => {
      triggerLiveCoach(recentTranscriptRef.current.trim());
      recentTranscriptRef.current = "";
    }, 5000);
  }, [autoAdvance, sections.length]);

  const handleSpeechError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  const { isListening, audioSource, start, stop, interimTranscript } = useSpeechRecognition({
    onTranscript: handleTranscript,
    onError: handleSpeechError,
  });

  const triggerLiveCoach = useCallback(async (recentText: string) => {
    if (!recentText || !sections[currentIndex]) return;
    setIsLiveCoaching(true);
    setLiveCoachResponse("");
    try {
      await streamCoach({
        body: {
          mode: "coaching_tip",
          currentSection: sections[currentIndex].content,
          conversationContext: `The prospect just said: "${recentText}". Current script section: ${sections[currentIndex].title}. Provide a brief, actionable coaching tip for what the salesperson should say or do next.`,
        },
        onDelta: (chunk) => setLiveCoachResponse((prev) => prev + chunk),
        onDone: () => setIsLiveCoaching(false),
        onError: (err) => {
          toast.error(err);
          setIsLiveCoaching(false);
        },
      });
    } catch {
      setIsLiveCoaching(false);
    }
  }, [currentIndex, sections]);

  useEffect(() => {
    if (scriptMode === "generated" && preBuiltSections) {
      // Pre-built sections from template — no AI needed
      try {
        const parsed = JSON.parse(preBuiltSections);
        setSections(parsed);
      } catch {
        navigate("/");
        return;
      }
      setIsAnalyzing(false);
      return;
    }

    if (!rawScript) {
      navigate("/");
      return;
    }
    loadScript();
  }, []);

  const loadScript = async () => {
    try {
      const result = await analyzeScript(rawScript);
      let parsed: ScriptSection[];
      try {
        const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        const paragraphs = rawScript.split("\n\n").filter(Boolean);
        parsed = paragraphs.map((p, i) => ({
          title: `Section ${i + 1}`,
          content: p.trim(),
          tone: "confident",
          tips: "Speak clearly and maintain eye contact.",
        }));
      }
      setSections(parsed);
    } catch {
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

  // Update keyword cache when section changes
  useEffect(() => {
    if (sections[currentIndex]) {
      sectionKeywordsRef.current = extractKeywords(sections[currentIndex].content);
      sectionTranscriptRef.current = "";
    }
  }, [currentIndex, sections]);

  const goNext = () => {
    if (currentIndex < sections.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCoachingTip("");
      setLiveCoachResponse("");
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCoachingTip("");
      setLiveCoachResponse("");
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
            <Button variant="ghost" size="sm" onClick={() => { stop(); navigate("/"); }} className="gap-1 text-muted-foreground">
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
                  onClick={() => { setCurrentIndex(i); setCoachingTip(""); setLiveCoachResponse(""); }}
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
            {/* Iframe Warning Banner */}
            {window.self !== window.top && (
              <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Audio recording requires the app to run in its own tab
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Browser security blocks microphone access inside embedded previews.
                    </p>
                  </div>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-500/20 px-3 py-1.5 text-sm font-medium text-yellow-400 transition hover:bg-yellow-500/30"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in New Tab
                  </a>
                </div>
              </div>
            )}

            {/* Audio Controls */}
            <div className="mb-4 animate-fade-in-up">
              <AudioControls
                isListening={isListening}
                audioSource={audioSource}
                onStart={start}
                onStop={stop}
              />
            </div>

            {/* Live Transcript */}
            {(isListening || transcriptEntries.length > 0) && (
              <div className="mb-4 rounded-xl border border-border/50 bg-card p-4 animate-fade-in-up">
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Live Transcript</h3>
                <LiveTranscript entries={transcriptEntries} interimText={interimTranscript} />
              </div>
            )}

            {/* Live AI Coach Response */}
            {(liveCoachResponse || isLiveCoaching) && (
              <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4 animate-fade-in-up">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                  <Zap className="h-4 w-4" />
                  Say This Now
                  {isLiveCoaching && <Loader2 className="h-3 w-3 animate-spin" />}
                </div>
                <p className="text-sm leading-relaxed text-foreground">{liveCoachResponse}</p>
              </div>
            )}

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

            {/* AI Coaching Tip (manual) */}
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoAdvance(!autoAdvance)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  autoAdvance
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {autoAdvance ? "Auto-advance ON" : "Auto-advance OFF"}
              </button>
            </div>
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
