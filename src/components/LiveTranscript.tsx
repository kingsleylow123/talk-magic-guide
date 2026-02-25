import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Speaker } from "@/hooks/use-speech-recognition";

interface TranscriptEntry {
  text: string;
  timestamp: number;
  isObjection?: boolean;
  speaker?: Speaker;
}

interface Props {
  entries: TranscriptEntry[];
  interimText: string;
}

const speakerConfig = {
  salesperson: {
    label: "You",
    textClass: "text-primary",
    bgClass: "bg-primary/10",
    borderClass: "border-primary/30",
  },
  prospect: {
    label: "Prospect",
    textClass: "text-accent",
    bgClass: "bg-accent/10",
    borderClass: "border-accent/30",
  },
};

const LiveTranscript = ({ entries, interimText }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, interimText]);

  if (entries.length === 0 && !interimText) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Start listening to see the live transcript here...
      </div>
    );
  }

  return (
    <ScrollArea className="h-48">
      <div className="space-y-2 p-1">
        {entries.map((entry, i) => {
          const speaker = entry.speaker || "salesperson";
          const config = speakerConfig[speaker];
          const prevSpeaker = i > 0 ? entries[i - 1].speaker : undefined;
          const showLabel = speaker !== prevSpeaker;

          return (
            <div key={i}>
              {showLabel && (
                <span
                  className={`mb-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.textClass} ${config.bgClass}`}
                >
                  {config.label}
                </span>
              )}
              <p
                className={`text-sm leading-relaxed pl-2 border-l-2 ${
                  entry.isObjection
                    ? "rounded border-l-2 border-destructive bg-destructive/5 pl-2 text-destructive"
                    : `${config.borderClass} text-foreground`
                }`}
              >
                {entry.text}
              </p>
            </div>
          );
        })}
        {interimText && (
          <p className="text-sm italic text-muted-foreground pl-2 border-l-2 border-muted">
            {interimText}
          </p>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};

export type { TranscriptEntry };
export default LiveTranscript;
