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

interface EvaluationRequest {
  session_id: string;
  interview_type: string;
  answers: AnswerData[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, interview_type, answers } = await req.json() as EvaluationRequest;

    if (!session_id || !interview_type || !answers || answers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: session_id, interview_type, and answers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the evaluation prompt
    const answersText = answers.map((a, i) => 
      `Question ${a.question_number}: ${a.question_text}\nAnswer: ${a.answer_text || '(No answer provided)'}`
    ).join('\n\n');

    const systemPrompt = `You are a supportive interview coach providing constructive feedback on mock interview answers. 
Your tone is encouraging, non-judgmental, and focused on learning and improvement.
This is for personal development only, NOT hiring decisions.

IMPORTANT: Use ONLY these qualitative ratings (no numeric scores):
- "Strong" - Answer demonstrates good understanding and communication
- "Average" - Answer is acceptable but could be improved
- "Needs Improvement" - Answer needs more work

Be specific, practical, and encouraging in all feedback.`;

    const userPrompt = `Evaluate this ${interview_type} mock interview session.

${answersText}

Provide a JSON response with this exact structure:
{
  "answer_evaluations": [
    {
      "answer_id": "<the answer id>",
      "relevance_rating": "Strong" | "Average" | "Needs Improvement",
      "clarity_rating": "Strong" | "Average" | "Needs Improvement", 
      "depth_rating": "Strong" | "Average" | "Needs Improvement",
      "feedback_text": "<2-3 sentences of constructive, encouraging feedback>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap 1>", "<gap 2>"],
  "improvement_tips": ["<specific actionable tip 1>", "<specific actionable tip 2>", "<specific actionable tip 3>"],
  "summary_message": "<A short encouraging summary, 1-2 sentences, focusing on growth>"
}

Answer IDs to use: ${JSON.stringify(answers.map(a => ({ id: a.id, question_number: a.question_number })))}

Remember:
- Be encouraging and supportive
- Focus on learning, not judgment
- Provide practical, specific suggestions
- Keep feedback concise but helpful`;

    console.log('Sending evaluation request to Lovable AI...');

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

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('Raw AI response:', content);

    // Parse JSON from the response (handle markdown code blocks)
    let evaluation;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      evaluation = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse evaluation response');
    }

    // Validate the response structure
    if (!evaluation.answer_evaluations || !Array.isArray(evaluation.answer_evaluations)) {
      throw new Error('Invalid evaluation structure: missing answer_evaluations');
    }

    console.log('Successfully parsed evaluation:', JSON.stringify(evaluation, null, 2));

    return new Response(
      JSON.stringify({
        session_id,
        answer_evaluations: evaluation.answer_evaluations,
        strengths: evaluation.strengths || [],
        gaps: evaluation.gaps || [],
        improvement_tips: evaluation.improvement_tips || [],
        summary_message: evaluation.summary_message || 'Great effort on your mock interview!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Evaluation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to evaluate interview' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
