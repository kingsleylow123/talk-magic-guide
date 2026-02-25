import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Plus, X, Loader2, Brain, Shield, Mic, DollarSign, Gift, FileText } from "lucide-react";
import { toast } from "sonner";

interface BonusItem {
  name: string;
  value: string;
}

const SAMPLE_OFFER = {
  productName: "Facebook Accelerator Course",
  productDescription: "12-week coaching program with weekly group calls, 1:1 strategy sessions, private community access, and a complete Facebook ads video course library.",
  normalPrice: "$6,000",
  discountedPrice: "$3,497 if you enroll today",
  bonuses: [
    { name: "Ad Template Library", value: "$997" },
    { name: "Private Slack Community", value: "$500" },
  ],
  targetAudience: "Coaches, consultants, and service providers",
  desiredResult: "Generate 10+ qualified leads per month using Facebook ads within 90 days",
};

const Index = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [normalPrice, setNormalPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [bonuses, setBonuses] = useState<BonusItem[]>([{ name: "", value: "" }]);
  const [targetAudience, setTargetAudience] = useState("");
  const [desiredResult, setDesiredResult] = useState("");

  const addBonus = () => setBonuses([...bonuses, { name: "", value: "" }]);
  const removeBonus = (i: number) => setBonuses(bonuses.filter((_, idx) => idx !== i));
  const updateBonus = (i: number, field: "name" | "value", val: string) => {
    const updated = [...bonuses];
    updated[i][field] = val;
    setBonuses(updated);
  };

  const loadSample = () => {
    setProductName(SAMPLE_OFFER.productName);
    setProductDescription(SAMPLE_OFFER.productDescription);
    setNormalPrice(SAMPLE_OFFER.normalPrice);
    setDiscountedPrice(SAMPLE_OFFER.discountedPrice);
    setBonuses(SAMPLE_OFFER.bonuses);
    setTargetAudience(SAMPLE_OFFER.targetAudience);
    setDesiredResult(SAMPLE_OFFER.desiredResult);
    toast.success("Sample offer loaded!");
  };

  const handleGenerate = async () => {
    if (!productName.trim() || !normalPrice.trim()) {
      toast.error("Please fill in at least the product name and price");
      return;
    }

    setIsGenerating(true);

    const offerDetails = {
      productName,
      productDescription,
      normalPrice,
      discountedPrice,
      bonuses: bonuses.filter((b) => b.name.trim()),
      targetAudience,
      desiredResult,
    };

    sessionStorage.setItem("offerDetails", JSON.stringify(offerDetails));

    try {
      const result = await generateScript(offerDetails);
      sessionStorage.setItem("salesScript", result);
      navigate("/session");
    } catch (err) {
      toast.error("Failed to generate script. Please try again.");
      setIsGenerating(false);
    }
  };

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

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight">
            Build Your <span className="text-gradient-primary">Closing Script</span> in Seconds
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Just fill in your offer details. Our AI uses the Application Close framework to generate a complete sales script with real-time coaching.
          </p>
        </div>

        {/* Features */}
        <div className="mb-10 grid grid-cols-3 gap-3">
          {[
            { icon: Brain, title: "AI Script Builder", desc: "Auto-generates your closing script" },
            { icon: Mic, title: "Real-Time Coaching", desc: "Listens to your call & coaches live" },
            { icon: Shield, title: "Objection Handling", desc: "Instant rebuttals for any pushback" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border/50 bg-card p-4 text-center">
              <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-6 rounded-2xl border border-border/50 bg-card p-6 shadow-lg">
          {/* Sample Script Button */}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={loadSample} className="gap-1.5 text-xs text-primary">
              <FileText className="h-3.5 w-3.5" />
              Load Sample Offer
            </Button>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <DollarSign className="h-5 w-5 text-primary" />
              Your Offer
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Product / Service Name *</label>
                <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Facebook Accelerator Course" className="border-border/50 bg-muted/30" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Target Audience</label>
                <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g. Coaches, consultants, agents" className="border-border/50 bg-muted/30" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">What does it help them achieve?</label>
              <Input value={desiredResult} onChange={(e) => setDesiredResult(e.target.value)} placeholder="e.g. Get 10 clients per month using Facebook ads" className="border-border/50 bg-muted/30" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Description (components, what's included)</label>
              <Textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} placeholder="e.g. 3-month 1:1 coaching, weekly calls, WhatsApp access, video course..." className="min-h-[80px] resize-none border-border/50 bg-muted/30 text-sm" />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <DollarSign className="h-5 w-5 text-accent" />
              Pricing
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Normal Price *</label>
                <Input value={normalPrice} onChange={(e) => setNormalPrice(e.target.value)} placeholder="e.g. $12,000" className="border-border/50 bg-muted/30" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Discounted Price (if any)</label>
                <Input value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} placeholder="e.g. $5,000 if they decide today" className="border-border/50 bg-muted/30" />
              </div>
            </div>
          </div>

          {/* Bonuses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Gift className="h-5 w-5 text-accent" />
                Bonuses
              </h2>
              <Button variant="ghost" size="sm" onClick={addBonus} className="gap-1 text-xs text-primary">
                <Plus className="h-3 w-3" /> Add Bonus
              </Button>
            </div>
            {bonuses.map((bonus, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Input value={bonus.name} onChange={(e) => updateBonus(i, "name", e.target.value)} placeholder={`Bonus ${i + 1} name`} className="border-border/50 bg-muted/30 text-sm" />
                  <Input value={bonus.value} onChange={(e) => updateBonus(i, "value", e.target.value)} placeholder="Value (e.g. $2,000)" className="border-border/50 bg-muted/30 text-sm" />
                </div>
                {bonuses.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeBonus(i)} className="mt-1 h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Generate Button */}
          <Button onClick={handleGenerate} disabled={isGenerating || !productName.trim() || !normalPrice.trim()} className="w-full gap-2 bg-primary py-6 text-lg font-semibold text-primary-foreground hover:bg-primary/90" size="lg">
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Your Script...
              </>
            ) : (
              <>
                Generate Closing Script
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

// Helper to build prompt and call the AI
async function generateScript(offer: {
  productName: string;
  productDescription: string;
  normalPrice: string;
  discountedPrice: string;
  bonuses: { name: string; value: string }[];
  targetAudience: string;
  desiredResult: string;
}): Promise<string> {
  const COACH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-coach`;

  const bonusList = offer.bonuses
    .filter((b) => b.name.trim())
    .map((b) => `${b.name}${b.value ? ` (${b.value} value)` : ""}`)
    .join(", ");

  const offerSummary = `
Product/Service: ${offer.productName}
${offer.productDescription ? `Description: ${offer.productDescription}` : ""}
${offer.targetAudience ? `Target Audience: ${offer.targetAudience}` : ""}
${offer.desiredResult ? `Desired Result: ${offer.desiredResult}` : ""}
Normal Price: ${offer.normalPrice}
${offer.discountedPrice ? `Discounted Price: ${offer.discountedPrice}` : ""}
${bonusList ? `Bonuses: ${bonusList}` : ""}
`.trim();

  const resp = await fetch(COACH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ mode: "generate_script", offerSummary }),
  });

  if (!resp.ok || !resp.body) throw new Error("Failed to generate");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let result = "";
  let textBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) result += content;
      } catch { /* partial */ }
    }
  }

  return result;
}

export default Index;
