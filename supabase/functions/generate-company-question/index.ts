import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { company, questionType, difficulty, year } = await req.json();
    
    console.log(`Generating questions for ${company}, type: ${questionType}, difficulty: ${difficulty}, year: ${year || 'any'}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const yearContext = year ? `Focus on interview patterns and questions commonly asked in ${year}.` : '';
    
    const systemPrompt = `You are an expert interview coach specializing in company-specific interview preparation.
Your role is to help candidates practice for interviews at specific companies.
Generate realistic, practice-focused interview questions that match the company's interview style.
Be encouraging and focus on learning, NOT evaluation or scoring.`;

    const userPrompt = `Generate 4 unique practice interview questions for a candidate preparing for an interview at ${company}.

Configuration:
- Question Type: ${questionType}
- Difficulty Level: ${difficulty}
${yearContext}

Requirements:
1. Questions should reflect ${company}'s known interview style and culture
2. For Technical questions: Include system design, coding concepts, or technical problem-solving
3. For Behavioral questions: Use STAR method compatible scenarios
4. For HR questions: Focus on culture fit, motivation, and career goals
5. For Coding questions: Describe algorithmic problems clearly (without code)

Difficulty Guidelines:
- Easy: Fundamental concepts, straightforward scenarios
- Medium: Moderate complexity, requires structured thinking
- Hard: Complex scenarios, multiple considerations, edge cases

Return ONLY a JSON array of 4 question objects with this exact format:
[
  {
    "question": "The full question text",
    "context": "Brief context about why this question is relevant for ${company}"
  }
]

Do NOT include any text outside the JSON array.`;

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("Raw AI response:", content);

    // Parse JSON from response
    let questions;
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse question data");
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid questions format");
    }

    console.log(`Successfully generated ${questions.length} questions for ${company}`);

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating company questions:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to generate questions" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
