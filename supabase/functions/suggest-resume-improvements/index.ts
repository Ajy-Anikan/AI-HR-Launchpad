import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skills, experience_years, education, summary, missing_skills, evaluation_gaps } = await req.json();

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Skills array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a supportive resume coach helping candidates improve their resumes for better interview outcomes. Provide specific, actionable, and encouraging suggestions. This is for personal development only — NOT for hiring decisions or ranking.`;

    const userPrompt = `Analyze this candidate's resume data and provide improvement suggestions.

Skills: ${skills.join(', ')}
Experience: ${experience_years || 0} years
Education: ${education || 'Not specified'}
Summary: ${summary || 'Not provided'}
${missing_skills?.length ? `Skill gaps from job matching: ${missing_skills.join(', ')}` : ''}
${evaluation_gaps?.length ? `Areas to improve from interview evaluations: ${evaluation_gaps.join(', ')}` : ''}

Return a JSON response with exactly this structure:
{
  "suggestions": [
    {
      "category": "skills_to_highlight" | "experience_enhancement" | "technical_depth" | "communication_structure",
      "priority": "high" | "medium" | "optional",
      "title": "<short suggestion title>",
      "explanation": "<1-2 sentence explanation of why this matters>",
      "action": "<specific recommended action the candidate should take>"
    }
  ]
}

Rules:
- Provide exactly 6-8 suggestions total
- Include at least one from each category
- At least 2 high priority, 2-3 medium, and 1-2 optional
- Be encouraging and specific
- Focus on actionable improvements, not vague advice
- Reference the candidate's actual skills when possible`;

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

    let result;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      result = JSON.parse(jsonString);
    } catch {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse improvement suggestions');
    }

    if (!result.suggestions || !Array.isArray(result.suggestions)) {
      throw new Error('Invalid response structure');
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Resume improvement error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate suggestions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
