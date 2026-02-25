import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, ArrowRight, Plus, X, Loader2, Brain, Shield, Mic, DollarSign, Gift, FileText, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";
import { SAMPLE_OFFER, SAMPLE_PASTED_SCRIPT, buildScript } from "@/lib/script-template";
import type { OfferDetails } from "@/lib/script-template";

interface BonusItem {
  name: string;
  value: string;
}

const Index = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  // Paste script state
  const [pastedScript, setPastedScript] = useState("");

  // Generate script state
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

  const loadSampleOffer = () => {
    setProductName(SAMPLE_OFFER.productName);
    setProductDescription(SAMPLE_OFFER.productDescription);
    setNormalPrice(SAMPLE_OFFER.normalPrice);
    setDiscountedPrice(SAMPLE_OFFER.discountedPrice);
    setBonuses(SAMPLE_OFFER.bonuses);
    setTargetAudience(SAMPLE_OFFER.targetAudience);
    setDesiredResult(SAMPLE_OFFER.desiredResult);
    toast.success("Sample offer loaded!");
  };

  const loadSampleScript = () => {
    setPastedScript(SAMPLE_PASTED_SCRIPT);
    toast.success("Sample script loaded!");
  };

  const handlePastedScript = () => {
    if (!pastedScript.trim()) {
      toast.error("Please paste your script first");
      return;
    }
    sessionStorage.setItem("salesScript", pastedScript);
    sessionStorage.setItem("scriptMode", "pasted");
    navigate("/session");
  };

  const handleGenerate = () => {
    if (!productName.trim() || !normalPrice.trim()) {
      toast.error("Please fill in at least the product name and price");
      return;
    }

    setIsGenerating(true);

    const offerDetails: OfferDetails = {
      productName,
      productDescription,
      normalPrice,
      discountedPrice,
      bonuses: bonuses.filter((b) => b.name.trim()),
      targetAudience,
      desiredResult,
    };

    // Build the script from the template directly — no AI needed
    const sections = buildScript(offerDetails);
    sessionStorage.setItem("scriptSections", JSON.stringify(sections));
    sessionStorage.setItem("offerDetails", JSON.stringify(offerDetails));
    sessionStorage.setItem("scriptMode", "generated");

    setIsGenerating(false);
    navigate("/session");
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
            Your <span className="text-gradient-primary">Closing Script</span> — Ready in Seconds
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Paste your own script or let us generate one from your offer details using the Application Close framework. Get real-time coaching on every call.
          </p>
        </div>

        {/* Features */}
        <div className="mb-10 grid grid-cols-3 gap-3">
          {[
            { icon: Brain, title: "Word-for-Word Script", desc: "Exact lines to read on every call" },
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

        {/* Tabs: Paste vs Generate */}
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="paste" className="gap-2">
              <ClipboardPaste className="h-4 w-4" />
              Paste Your Script
            </TabsTrigger>
            <TabsTrigger value="generate" className="gap-2">
              <Zap className="h-4 w-4" />
              Generate From Offer
            </TabsTrigger>
          </TabsList>

          {/* PASTE TAB */}
          <TabsContent value="paste">
            <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Paste Your Sales Script</h2>
                <Button variant="ghost" size="sm" onClick={loadSampleScript} className="gap-1.5 text-xs text-primary">
                  <FileText className="h-3.5 w-3.5" />
                  Load Sample Script
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Already have a script? Paste it below. We'll break it into sections and provide real-time coaching during your calls.
              </p>
              <Textarea
                value={pastedScript}
                onChange={(e) => setPastedScript(e.target.value)}
                placeholder="Paste your complete sales script here..."
                className="min-h-[300px] resize-none border-border/50 bg-muted/30 text-sm leading-relaxed"
              />
              <Button
                onClick={handlePastedScript}
                disabled={!pastedScript.trim()}
                className="w-full gap-2 bg-primary py-6 text-lg font-semibold text-primary-foreground hover:bg-primary/90"
                size="lg"
              >
                Start Session with My Script
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </TabsContent>

          {/* GENERATE TAB */}
          <TabsContent value="generate">
            <div className="space-y-6 rounded-2xl border border-border/50 bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Generate from Offer Details</h2>
                <Button variant="ghost" size="sm" onClick={loadSampleOffer} className="gap-1.5 text-xs text-primary">
                  <FileText className="h-3.5 w-3.5" />
                  Load Sample Offer
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Fill in your offer details below. We'll generate a complete word-for-word Application Close script — only the offer and pricing sections are customized.
              </p>

              {/* Product */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Your Offer
                </h3>
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
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <DollarSign className="h-5 w-5 text-accent" />
                  Pricing
                </h3>
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
                  <h3 className="flex items-center gap-2 text-base font-semibold">
                    <Gift className="h-5 w-5 text-accent" />
                    Bonuses
                  </h3>
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
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !productName.trim() || !normalPrice.trim()}
                className="w-full gap-2 bg-primary py-6 text-lg font-semibold text-primary-foreground hover:bg-primary/90"
                size="lg"
              >
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
