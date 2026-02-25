import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { script, currentSection, objection, conversationContext, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "analyze_script") {
      systemPrompt = `You are an expert sales script analyzer. Break down the given sales script into clear, actionable sections. For each section, provide:
1. A short title (2-5 words)
2. The key talking points
3. Suggested tone (confident, empathetic, urgent, casual, etc.)
4. Tips for delivery

Return your response as a JSON array with objects containing: title, content, tone, tips.
IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`;
      userPrompt = `Analyze this sales script and break it into sections:\n\n${script}`;
    } else if (mode === "handle_objection") {
      systemPrompt = `You are an elite sales closing coach specializing in real-time objection handling. You help salespeople overcome objections with confidence and empathy.

Your responses should be:
- Direct and actionable (what to say word-for-word)
- Empathetic but assertive
- Include 2-3 alternative approaches
- Brief enough to read quickly during a live call

Format: Start with the BEST response to say, then provide alternatives labeled "Alternative 1:", "Alternative 2:".`;
      userPrompt = `The prospect just said: "${objection}"

Context from the sales script: ${currentSection || "General sales conversation"}
Conversation context: ${conversationContext || "Initial call"}

Give me the best response to handle this objection and close the sale.`;
    } else if (mode === "coaching_tip") {
      systemPrompt = `You are a real-time sales coach. Provide a brief, actionable coaching tip for the current moment in the sales call. Keep it to 1-2 sentences max. Be specific and practical.`;
      userPrompt = `The salesperson is currently at this part of their script: "${currentSection}"
      
Conversation context: ${conversationContext || "Ongoing call"}

Give a quick coaching tip for this moment.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("sales-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
