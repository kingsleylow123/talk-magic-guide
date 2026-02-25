/**
 * Word-for-word Application Close script template from Alaric Ong.
 * Only the offer details, price, and bonuses sections are customized.
 * Everything else is the EXACT script from the methodology.
 */

export interface OfferDetails {
  productName: string;
  productDescription: string;
  normalPrice: string;
  discountedPrice: string;
  bonuses: { name: string; value: string }[];
  targetAudience: string;
  desiredResult: string;
}

export interface ScriptSection {
  title: string;
  content: string;
  tone: string;
  tips: string;
}

const SAMPLE_OFFER: OfferDetails = {
  productName: "Facebook Accelerator Course",
  productDescription:
    "12-week coaching program with weekly group calls, 1:1 strategy sessions, private community access, and a complete Facebook ads video course library.",
  normalPrice: "$6,000",
  discountedPrice: "$3,497 if you enroll today",
  bonuses: [
    { name: "Ad Template Library", value: "$997" },
    { name: "Private Slack Community", value: "$500" },
  ],
  targetAudience: "Coaches, consultants, and service providers",
  desiredResult:
    "Generate 10+ qualified leads per month using Facebook ads within 90 days",
};

export { SAMPLE_OFFER };

export const SAMPLE_PASTED_SCRIPT = `Great, so what made you decide to schedule this appointment with me?

[Wait for response]

Awesome! I'd love to learn more about you. Let me ask you a few questions so I can understand your situation better.

Question 1: What is the result you would like to achieve?

[Wait for response, dig deeper: "Tell me more about that", "What does that look like specifically?"]

Question 2: What is your current situation? Around how much are you making right now? Is it in the range of $0-$2k, $2k to $5k, $5k to $10k, or more?

[Wait for response]

Question 3: What is the biggest pain about staying in your current situation?

[Wait for response, dig deeper]

Question 4: What are the obstacles preventing you from getting to your desired result?

[Wait for response]

Question 5: On a scale of 1 to 10, how willing are you to get to your desired result?

[If 6/10 or below: "I see, so it's not really that important to you right now? Let me ask from a different angle..."]
[If 7/10 or above: Continue below]

Based on what you said, I know the perfect solution to help you! Shall I share it with you?

Ok so here's how I normally like to do my calls. I will explain to you everything I have to offer, and how it can help you. And you can ask me any questions you want during the call. By the end of this call, I will want you to make a decision. Either a "Yes" or a "No". If it's a "Yes", great, we can work closely together. If it's a "No", that's fine as well, we can still be friends. If you really really need to think about it, you can put in a refundable deposit, and I'll give you some time to think about it. But I would want a decision at the end of the call. Is that ok?

Ok great! So either a "YES" or a "NO", or a refundable deposit if you really need to think about it. Sounds good?

So I have this programme called Facebook Accelerator Course that helps you to generate 10+ qualified leads per month using Facebook ads. It consists of 12-week coaching program with weekly group calls, 1:1 strategy sessions, private community access, and a complete Facebook ads video course library.

And this will potentially help you get from where you are now to your desired result.

Did you get value from what I've shared so far? Can you help me to film a quick testimonial sharing about what you have learnt? Your name, what you do, and what you've learnt?

Thank you for your testimonial!

Now let me ask you a few more questions.

Do you feel that this will be able to help you?

How do you feel it can help you?

[Let them convince you]

Are you able to make a decision on your own? Or do you have to consult anyone?

If this is the right fit, can you start now? Or must you wait a few months?

Is there anything else that can potentially stop you from doing this?

If the price was $6,000, would you be able to get it?

One last question, why do you want to succeed?

[Let them talk]

Ok great, so based on what you are telling me so far, I think this would be the right fit for you. And the reason why is because I like that you're committed to your goals. So do you want to enrol in this programme?

So this programme is normally $6,000. But if you make a decision today, or at least put in a deposit, it is only $3,497.

Are you okay with that?

On top of that, you'll also get these bonuses:
- Ad Template Library valued at $997
- Private Slack Community valued at $500

Ok great, so this is my bank account number. You can go ahead and make the payment. I'll wait for you on this call itself. Once you make the payment, I will onboard you. Sounds good?

[If objections arise, handle them]

Okay great, so I have just finished addressing all your concerns! So now this 7/10 is a 10/10 right? Awesome, so are you ready to get started?

As promised, I'll send some bonuses to you for free. By the way, how's your business going? How did you feel about our conversation today?

Glad you've gotten value, have a nice day ahead!`;

/**
 * Build the complete word-for-word Application Close script
 * using the exact Alaric Ong methodology. Only offer/price
 * sections are customized based on user input.
 */
export function buildScript(offer: OfferDetails): ScriptSection[] {
  const bonusLines = offer.bonuses
    .filter((b) => b.name.trim())
    .map((b) => `- ${b.name}${b.value ? ` valued at ${b.value}` : ""}`)
    .join("\n");

  const totalBonusValue = offer.bonuses
    .filter((b) => b.value.trim())
    .map((b) => b.value)
    .join(" + ");

  return [
    {
      title: "Opening & Rapport",
      content: `Great, so what made you decide to schedule this appointment with me?\n\n[Wait for response]\n\nAwesome! I'd love to learn more about you. Let me ask you a few questions so I can understand your situation better and see if I can help.`,
      tone: "warm",
      tips: "Be genuinely curious. Smile. Build rapport naturally before diving into questions.",
    },
    {
      title: "Consultation Question 1 – Desired Result",
      content: `So tell me, what is the result you would like to achieve?\n\n[Wait for response]\n\nTell me more about that. What does that look like specifically?\n\n[Dig deeper — keep asking follow-ups until you truly understand what they want]`,
      tone: "curious",
      tips: "Write down their exact words. These are the 'hot buttons' you'll use later to sell.",
    },
    {
      title: "Consultation Question 2 – Current Situation",
      content: `And what is your current situation right now? Around how much are you making right now? Is it in the range of $0 to $2k, $2k to $5k, $5k to $10k, or more?\n\n[Wait for response]\n\nI see, so you're currently at about that range. Got it.\n\n[Take notes — ask for ranges, not exact numbers]`,
      tone: "empathetic",
      tips: "Always ask for ranges when discussing money. It's less intimidating and more honest.",
    },
    {
      title: "Consultation Question 3 – Biggest Pain",
      content: `What is the biggest pain about staying in your current situation?\n\n[Wait for response]\n\nI can totally understand that. That must be really frustrating.\n\n[Dig deeper — "What else?", "How does that affect your daily life?"]`,
      tone: "empathetic",
      tips: "Let them feel the pain. The more they feel it, the more motivated they are to change.",
    },
    {
      title: "Consultation Question 4 – Obstacles",
      content: `What are the obstacles preventing you from getting to your desired result?\n\n[Wait for response]\n\nSo the main things holding you back are those obstacles. I totally get that.\n\n[Write down every obstacle — these become selling points later]`,
      tone: "understanding",
      tips: "Don't try to solve their problems yet. Just listen and take notes.",
    },
    {
      title: "Consultation Question 5 – Willingness Scale",
      content: `On a scale of 1 to 10, how willing are you to get to your desired result?\n\n[Wait for response]\n\n[If 6/10 or below:]\nI see, so it's not really the most important thing for you right now. Let me ask from a different angle — what about in terms of your lifestyle or your family? What would changing this mean for them?\n\n[Repeat consultation questions from a different angle until they are 7/10 or above]\n\n[If 7/10 or above:]\nGreat! Based on what you said, I know the perfect solution to help you! Shall I share it with you?`,
      tone: "confident",
      tips: "If they're 6 or below, don't pitch. Change the angle — health, family, freedom — and re-ask.",
    },
    {
      title: "Deal or No Deal Pre-Frame",
      content: `Ok so here's how I normally like to do my calls. I will explain to you everything I have to offer, and how it can help you. And you can ask me any questions you want during the call. By the end of this call, I will want you to make a decision. Either a "Yes" or a "No". If it's a "Yes", great, we can work closely together. If it's a "No", that's fine as well, we can still be friends. If you really really need to think about it, you can put in a refundable deposit, and I'll give you some time to think about it. But I would want a decision at the end of the call. Is that ok?\n\n[Prospect says: Ok]\n\nOk great! So either a "YES" or a "NO", or a refundable deposit if you really need to think about it. Sounds good?`,
      tone: "confident",
      tips: "This pre-frame eliminates 'I need to think about it' later. Say it naturally, not aggressively.",
    },
    {
      title: "Recap Consultation Answers",
      content: `Just now you mentioned you wanted [their desired result] correct?\n\n[Yes]\n\nAnd you mentioned you are currently [their current situation] correct?\n\n[Yes]\n\nAnd your main obstacles are [their obstacles] correct?\n\n[Yes]\n\nAnd your biggest pain is [their pain] correct?\n\n[Yes]\n\nOkay based on what you said, I have the perfect solution just for you.`,
      tone: "confident",
      tips: "Repeat their EXACT words back to them. This makes them say 'yes, yes, yes' and primes them to keep saying yes.",
    },
    {
      title: "Present the Solution",
      content: `So I have this ${offer.productName} that helps you to ${offer.desiredResult || "achieve your goals"}.\n\n${offer.productDescription ? `It consists of ${offer.productDescription}.` : ""}\n\nAnd this will potentially help you get from your current situation to your desired result, overcome your obstacles, and get out of the pain you're feeling right now.`,
      tone: "enthusiastic",
      tips: "Connect EVERY feature back to their specific pain, obstacles, and desired result.",
    },
    {
      title: "Collect Testimonials (Optional)",
      content: `Did you get value from what I've shared so far?\n\n[Wait for response]\n\nAwesome! Can you help me to film a quick testimonial sharing about what you have learnt? Just three things — your name, what you do, and what you've learnt today?\n\n[After they film]\n\nThank you so much for your testimonial! I really appreciate it.`,
      tone: "warm",
      tips: "The best time to sell is RIGHT AFTER someone gives you a testimonial — they just said you're good!",
    },
    {
      title: "Qualification Questions",
      content: `Now let me ask you a few more questions.\n\nDo you feel that this will be able to help you?\n\n[Wait — "Yup I guess so"]\n\nHow do you feel it can help you?\n\n[Let them convince YOU on how your product will help them]\n\nSo what makes you want to get ${offer.productName}?\n\n[Let them talk]\n\nAre you able to make a decision on your own? Or do you have to consult anyone?\n\n[If they need to consult someone:]\nOk I understand that you need to inform them. Definitely, it is important to inform our family. But I was asking, do you need to ASK for permission from them? Or are you able to just INFORM them instead of asking for permission?\n\n[If they can decide:]\nOk, so that means you just need to inform them but you can make a decision by yourself right?\n\nIf this is the right fit, can you start now? Or must you wait a few months?\n\nIs there anything else that can potentially stop you from doing this?\n\n[Handle any objections that come up NOW, before revealing price]`,
      tone: "confident",
      tips: "Handle ALL objections BEFORE price. Resistance is much higher after mentioning price.",
    },
    {
      title: "Price Qualification",
      content: `If the price was ${offer.normalPrice}, would you be able to get it?\n\n[If big ticket, break it down:]\nAnd if you can split it by 12 months using a credit card, that would be only about $X per day. Would you be able to manage that?\n\n[Discuss financing — credit card, instalments, etc. Make sure pricing issues are handled before the next question]\n\nOne last question, why do you want to succeed?\n\n[Let them talk about why they want it — this is their deepest motivation]`,
      tone: "direct",
      tips: "Don't reveal the actual price yet. You're just qualifying that they CAN afford it.",
    },
    {
      title: "The Close & Price Reveal",
      content: `Ok great, so based on what you are telling me so far, I think this would be the right fit for you. And the reason why is because I like that you're committed and I can see you're serious about getting results. So do you want to enrol in this programme?\n\nSo this ${offer.productName} is normally ${offer.normalPrice}.\n\n[Pause]\n\n${offer.discountedPrice ? `But if you make a decision today, or at least put in a deposit, it is only ${offer.discountedPrice}.` : ""}\n\n${bonusLines ? `And on top of that, you'll also get these bonuses:\n${bonusLines}${totalBonusValue ? `\n\nThat's ${totalBonusValue} worth of bonuses included.` : ""}` : ""}\n\nAre you okay with that?`,
      tone: "confident",
      tips: "Pause after saying the price. Let them process. Don't fill the silence.",
    },
    {
      title: "Collect Payment",
      content: `Ok great, so this is my bank account number. You can go ahead and make the payment. I'll wait for you on this call itself.\n\nOnce you make the payment, I will onboard you. Sounds good?\n\n[Wait for them to transfer — embrace the silence. It will feel awkward. That's normal. Give them time and space to do the transfer.]`,
      tone: "calm",
      tips: "Make sure they transfer DURING the call. Don't let them say 'I'll do it after'. Embrace the silence.",
    },
    {
      title: "Handle Objections & Final Push",
      content: `[If they have objections, handle them one by one. Link back to their desired result, current situation, obstacles, and pain.]\n\n[Use: "I used to be like you..." or "There is this person just like you..." then handle the objection.]\n\n[Persevere until 3 "Hard No"s before letting go.]\n\nOkay great, so I have just finished addressing all your concerns! So now this 7/10 is a 10/10 right? Awesome, so are you ready to get started?\n\n[If still hesitant — Risk Analysis:]\nSo after answering all your concerns you're still a little bit scared is it? Hahaha it's normal! Last time I was also like that. But I thought to myself, what's the worst thing that could happen? Business people all do this thing called a risk analysis.\n\nBest case scenario: Your business grows, your income increases, your life changes. You're able to provide for your family and your network expands.\n\nWorst case scenario: You lose the investment, but what do you get? You get to learn proven skills, join an amazing community, and network with other successful people. That's the WORST that could happen.\n\nMost likely scenario: You make your investment back quickly by applying what you learn.\n\nIt's a no brainer! So are you ready to get started?`,
      tone: "persistent",
      tips: "Most sales happen AFTER the prospect rejects. Don't give up after the first no.",
    },
    {
      title: "Build Rapport & End Call",
      content: `As promised, I'll send some bonuses to you for free.\n\n[Prospect: Thank you!]\n\nBy the way, how did you feel about our conversation today? How's your business going?\n\n[Build rapport — ask about their life, family, business]\n\nOk so I'm just going to give you a quick action plan on what you need to do. Write this down:\n1) [Action step 1]\n2) [Action step 2]\n3) [Action step 3]\n\nDid you get value? Great! Glad you've gotten value, have a nice day ahead!\n\n[Whether the sale was closed or not, ALWAYS build rapport before ending. This plants the seed for future follow-up.]`,
      tone: "warm",
      tips: "Always end on a positive note. This makes follow-up easy and keeps the relationship strong.",
    },
  ];
}
