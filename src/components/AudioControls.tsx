import { Mic, Monitor, Radio, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AudioSource } from "@/hooks/use-speech-recognition";

interface Props {
  isListening: boolean;
  audioSource: AudioSource;
  onStart: (source: AudioSource) => void;
  onStop: () => void;
}

const AudioControls = ({ isListening, audioSource, onStart, onStop }: Props) => {
  if (isListening) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
          </span>
          <span className="text-sm font-medium text-foreground">
            Listening via {audioSource === "mic" ? "Microphone" : audioSource === "system" ? "Tab Audio" : "Mic + Tab"}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onStop}
          className="ml-auto gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <Square className="h-3 w-3" />
          Stop
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Listen via:</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onStart("mic")}
        className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
      >
        <Mic className="h-3.5 w-3.5" />
        Microphone
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onStart("system")}
        className="gap-1.5 border-accent/30 text-accent hover:bg-accent/10"
      >
        <Monitor className="h-3.5 w-3.5" />
        Tab Audio
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onStart("both")}
        className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
      >
        <Radio className="h-3.5 w-3.5" />
        Both
      </Button>
    </div>
  );
};

export default AudioControls;
