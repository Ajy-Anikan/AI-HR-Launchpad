import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RequestBody {
  interview_type: 'technical' | 'behavioral' | 'hr';
  role_level: 'fresher' | 'junior' | 'mid';
  skills: string[];
  experience_years: number | null;
  question_number: number;
  total_questions: number;
  previous_questions?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { 
      interview_type, 
      role_level, 
      skills, 
      experience_years, 
      question_number, 
      total_questions,
      previous_questions = []
    } = body;

    console.log('Generating question:', { interview_type, role_level, question_number, skills });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const skillsList = skills.length > 0 ? skills.join(', ') : 'general programming';
    const experienceText = experience_years 
      ? `${experience_years} years of experience` 
      : 'entry-level experience';

    const previousQuestionsText = previous_questions.length > 0 
      ? `\n\nPrevious questions already asked (DO NOT repeat these):\n${previous_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : '';

    const systemPrompt = `You are a supportive and encouraging mock interview coach. Your goal is to help candidates practice interview skills in a calm, non-judgmental environment.

Generate interview questions that are:
- Clear and realistic
- Appropriate for the candidate's experience level
- Relevant to their skills
- Encouraging growth and learning

Always maintain a supportive tone. This is practice, not a real hiring interview.`;

    const userPrompt = `Generate interview question ${question_number} of ${total_questions} for a mock interview.

Interview Type: ${interview_type}
Role Level: ${role_level}
Candidate Skills: ${skillsList}
Experience: ${experienceText}
${previousQuestionsText}

Requirements:
- Generate exactly ONE ${interview_type} interview question
- The question should be appropriate for a ${role_level} level candidate
- Make it relevant to their skills: ${skillsList}
- Keep the question clear and concise (1-3 sentences)
- Do not include any preamble or explanation, just the question itself
- Do not number the question or add prefixes like "Question:"

Return only the question text, nothing else.`;

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
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service quota exceeded. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate question");
    }

    const data = await response.json();
    const question = data.choices?.[0]?.message?.content?.trim();

    if (!question) {
      throw new Error("No question generated");
    }

    console.log('Generated question:', question);

    return new Response(
      JSON.stringify({ question }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating interview question:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
