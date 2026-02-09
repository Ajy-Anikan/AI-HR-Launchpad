import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AnswerData {
  id: string;
  question_number: number;
  question_text: string;
  answer_text: string | null;
}

interface EvalRequest {
  session_id: string;
  company: string;
  question_type: string;
  difficulty: string;
  practice_year: number | null;
  answers: AnswerData[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, company, question_type, difficulty, practice_year, answers } = await req.json() as EvalRequest;

    if (!session_id || !company || !question_type || !answers || answers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const answersText = answers.map(a =>
      `Question ${a.question_number}: ${a.question_text}\nAnswer: ${a.answer_text || '(No answer provided)'}`
    ).join('\n\n');

    const systemPrompt = `You are a supportive interview coach specializing in company-specific interview preparation.
Your tone is encouraging, coaching-style, and focused on learning and improvement.
This is strictly for candidate self-improvement, NOT for hiring decisions.

IMPORTANT: Use ONLY these qualitative ratings (no numeric scores):
- "Strong"
- "Fair"
- "Needs Improvement"

Tailor all feedback to the specific company's known interview style and expectations.`;

    const userPrompt = `Evaluate this ${company} company prep practice session.
Company: ${company}
Question Type: ${question_type}
Difficulty: ${difficulty}
${practice_year ? `Year: ${practice_year}` : ''}

${answersText}

Provide a JSON response with this exact structure:
{
  "answer_evaluations": [
    {
      "answer_id": "<the answer id>",
      "relevance_rating": "Strong" | "Fair" | "Needs Improvement",
      "clarity_rating": "Strong" | "Fair" | "Needs Improvement",
      "depth_rating": "Strong" | "Fair" | "Needs Improvement",
      "feedback_text": "<2-3 sentences of constructive, coaching-style feedback tailored to ${company}'s interview expectations>"
    }
  ],
  "strengths": ["<strength aligned with ${company}'s interview style>", "<another strength>"],
  "gaps": ["<gap to improve for ${company}>", "<another gap>"],
  "improvement_tips": ["<actionable tip for ${question_type} at ${company}>", "<another tip>", "<third tip>"],
  "summary_message": "<A short encouraging summary, 1-2 sentences, mentioning ${company} specifically>"
}

Answer IDs to use: ${JSON.stringify(answers.map(a => ({ id: a.id, question_number: a.question_number })))}

Remember:
- Tailor feedback to ${company}'s known interview culture and expectations
- Be encouraging and coaching-focused
- Provide practical, company-specific suggestions
- Keep feedback concise but helpful
- No numeric scores, no hiring recommendations`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content in AI response');

    let evaluation;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      evaluation = JSON.parse(jsonString);
    } catch {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse evaluation response');
    }

    if (!evaluation.answer_evaluations || !Array.isArray(evaluation.answer_evaluations)) {
      throw new Error('Invalid evaluation structure');
    }

    return new Response(
      JSON.stringify({
        session_id,
        answer_evaluations: evaluation.answer_evaluations,
        strengths: evaluation.strengths || [],
        gaps: evaluation.gaps || [],
        improvement_tips: evaluation.improvement_tips || [],
        summary_message: evaluation.summary_message || 'Great effort on your practice session!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Evaluation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to evaluate session' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
