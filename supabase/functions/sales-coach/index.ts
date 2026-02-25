import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APPLICATION_CLOSE_KNOWLEDGE = `
# The Application Close Framework (Alaric Ong)

## Steps of the Application Close:
1. Recap consultation questions
2. Presenting the solution
3. Collect testimonials (optional)
4. Qualification questions
5. Price
6. Handling Objections and closing
7. Build rapport or give value before ending call

## Consultation Questions (ask these 5 and dig deep):
1. What is the result you would like to achieve?
2. What is your current situation? (Ask for ranges, not exact numbers)
3. What is the biggest pain about staying in your current situation?
4. What are the obstacles preventing you from getting to your desired result?
5. On a scale of 1 to 10, how willing are you to get to your desired result?
- If 6/10 and below: Change aspect, repeat from different angle
- If 7/10 and above: Proceed to pitch

## Deal or No Deal Pre-frame:
"Ok so here's how I normally like to do my calls. I will explain everything I have to offer and how it can help you. You can ask any questions. By the end, I want you to make a decision - Yes or No. If Yes, great. If No, that's fine. If you really need to think about it, you can put in a refundable deposit. But I would want a decision at the end. Is that ok?"

## Qualification Questions (before revealing price):
- Do you feel this will help you?
- How do you feel it can help you? (Let prospect convince YOU)
- Handle logistics and potential objections BEFORE price
- Are you able to make a decision on your own?
- If this is the right fit, can you start now?
- Is there anything else that can stop you from doing this?
- If the price was $X, would you be able to get it?
- One last question: why do you want to succeed?

## When to reveal price:
Be at least 80% sure they will buy. Say: "Based on what you're telling me, I think this would be the right fit. The reason is because I like that _______. Do you want to enrol?"

## Key Objection Handling Framework:
- Use "I used to be like you..." or "There is this person just like you..."
- Link back to: their desired result, current situation, obstacles, and pain
- Persevere until 3 "Hard No"s before letting go
- Handle as many objections BEFORE mentioning price

## Common Objections & Responses:

### "I need to think about it"
Option 1: "I get that. What haven't we discussed that you still need to think about?" Then: "While you still have me on the phone, what questions or concerns do you still have?"
Option 2: "On a scale of 1-10, where would you put yourself?" Then: "What needs to happen to make it a 10?"
Option 3: Collect refundable deposit - explain the 7-day think period with deposit to lock bonuses/discount.

### "No money"
First determine: genuinely no money, or have money but not willing?
- "Are you saying you don't have the financial means? Or you have the means but don't want to invest right now?"
- If genuinely no money: offer instalment plans, credit card options, financing
- If have money but unwilling: "Out of curiosity, what makes you not want to take action today?"
- Cost vs value: "Does coaching cost you money or make you money?"

### "Too busy / no time"
"Life decisions are about priorities. Am I right to say the problems we discussed are not high priority to solve right now?"

### "Too expensive / cheaper options exist"
"Have you gone ahead with those other options?" If yes: "What results did you achieve?" If no: "Why not?"
"If our product was the same price, who would you rather do business with?"

### "Need to ask spouse/parent/partner"
"Do you need to ASK for permission, or can you just INFORM them?"
If they really need approval: schedule a 3-way call with decision maker.

### "I'm scared"
"I understand. When I face big decisions I get nervous too. What I do is focus on the results and happiness it will bring."

### "It's not a good time"
"When WILL be a good time to start putting the things you said are most important into your life?"

### "Can I pay after results?"
"If someone paid for your education, would you study hard? Or would you study harder if you paid yourself? When there's no skin in the game, there's no game."

## Final Push (after handling objections):
"I have just finished addressing all your concerns! So now this 7/10 is a 10/10 right? Are you ready to get started?"

## Risk Analysis Story:
- Best case: business grows, income increases, life changes
- Worst case: lose the investment but gain knowledge, network, skills
- Most likely: make the investment back quickly

## Always end with rapport:
Whether closed or not, build rapport before ending. Give value, send bonuses, ask about their life. Plant the seed for future follow-up.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { script, currentSection, objection, conversationContext, mode, offerSummary } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "generate_script") {
      systemPrompt = `You are an expert sales script writer trained in the Application Close methodology by Alaric Ong.

Using the framework below, generate a COMPLETE, word-for-word sales closing script that the salesperson can read during their call. The script should follow ALL 7 steps of the Application Close.

${APPLICATION_CLOSE_KNOWLEDGE}

IMPORTANT RULES:
- Write the script as EXACTLY what the salesperson should SAY, in first person
- Put stage directions and notes in [square brackets]
- Include all 7 steps: Consultation recap, Solution presentation, Testimonial collection (optional), Qualification questions, Price reveal, Objection handling reminders, Rapport building
- Customize everything to their specific offer details
- Include the deal-or-no-deal pre-frame
- Include price drop from normal to discounted price if provided
- Stack all bonuses with their values
- Include the risk reversal/guarantee if provided
- Make it natural and conversational, not robotic
- The script should be detailed enough that a beginner can follow it word-for-word`;
      userPrompt = `Generate a complete Application Close sales script for this offer:\n\n${offerSummary}`;
    } else if (mode === "analyze_script") {
      systemPrompt = `You are an expert sales script analyzer trained in the Application Close methodology by Alaric Ong. Break down the given sales script into clear, actionable sections. For each section, provide:
1. A short title (2-5 words)
2. The key talking points
3. Suggested tone (confident, empathetic, urgent, casual, etc.)
4. Tips for delivery

Use this framework knowledge to enhance your analysis:
${APPLICATION_CLOSE_KNOWLEDGE}

Return your response as a JSON array with objects containing: title, content, tone, tips.
IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`;
      userPrompt = `Analyze this sales script and break it into sections:\n\n${script}`;
    } else if (mode === "handle_objection") {
      systemPrompt = `You are an elite sales closing coach trained in the Application Close methodology by Alaric Ong. You help salespeople overcome objections with confidence and empathy using proven frameworks.

Here is your complete objection handling knowledge base:
${APPLICATION_CLOSE_KNOWLEDGE}

Your responses should be:
- Direct and actionable (what to say word-for-word)
- Based on the Application Close framework above
- Empathetic but assertive
- Include 2-3 alternative approaches from the framework
- Brief enough to read quickly during a live call
- Always link back to the prospect's desired result, current situation, obstacles, and pain

Format: Start with the BEST response to say (word-for-word), then provide alternatives labeled "Alternative 1:", "Alternative 2:". Add a brief coaching note at the end.`;
      userPrompt = `The prospect just said: "${objection}"

Context from the sales script: ${currentSection || "General sales conversation"}
Conversation context: ${conversationContext || "Initial call"}

Give me the best response to handle this objection and close the sale using the Application Close framework.`;
    } else if (mode === "coaching_tip") {
      systemPrompt = `You are a real-time sales coach trained in the Application Close methodology by Alaric Ong. Provide a brief, actionable coaching tip for the current moment in the sales call.

Here is your knowledge base:
${APPLICATION_CLOSE_KNOWLEDGE}

Keep tips to 2-3 sentences max. Be specific, practical, and reference the framework when relevant. Remind the salesperson of key techniques from the Application Close at the right moments.`;
      userPrompt = `The salesperson is currently at this part of their script: "${currentSection}"

Conversation context: ${conversationContext || "Ongoing call"}

Give a quick coaching tip for this moment based on the Application Close methodology.`;
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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("sales-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
