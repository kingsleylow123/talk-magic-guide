import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptEntry {
  text: string;
  timestamp: number;
  isObjection?: boolean;
}

interface Props {
  entries: TranscriptEntry[];
  interimText: string;
}

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
      <div className="space-y-1.5 p-1">
        {entries.map((entry, i) => (
          <p
            key={i}
            className={`text-sm leading-relaxed ${
              entry.isObjection
                ? "rounded border-l-2 border-destructive bg-destructive/5 pl-2 text-destructive"
                : "text-foreground"
            }`}
          >
            {entry.text}
          </p>
        ))}
        {interimText && (
          <p className="text-sm italic text-muted-foreground">{interimText}</p>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};

export type { TranscriptEntry };
export default LiveTranscript;
