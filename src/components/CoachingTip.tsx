import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  tip: string;
  isLoading: boolean;
  onRequest: () => void;
}

const CoachingTip = ({ tip, isLoading, onRequest }: Props) => {
  if (!tip && !isLoading) {
    return (
      <Button
        variant="outline"
        onClick={onRequest}
        className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5"
      >
        <Brain className="h-4 w-4" />
        Get AI Coaching Tip
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 animate-fade-in-up">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
        <Brain className="h-4 w-4" />
        AI Coach
        {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{tip}</p>
    </div>
  );
};

export default CoachingTip;
