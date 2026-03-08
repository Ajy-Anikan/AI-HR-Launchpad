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
    const { skills, experience_years, missing_skills, strengths, gaps } = await req.json();

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

    const systemPrompt = `You are a supportive career guidance counselor. Based on the candidate's skills and background, suggest personalized career paths. This is strictly for self-improvement and guidance — NOT for hiring decisions or ranking.

Be encouraging, practical, and specific. Focus on growth opportunities.`;

    const userPrompt = `Based on this candidate's profile, suggest exactly 3 career paths.

Skills: ${skills.join(', ')}
Experience: ${experience_years || 0} years
${missing_skills?.length ? `Skill gaps identified: ${missing_skills.join(', ')}` : ''}
${strengths?.length ? `Strengths from evaluations: ${strengths.join(', ')}` : ''}
${gaps?.length ? `Areas for improvement: ${gaps.join(', ')}` : ''}

Return a JSON response with this exact structure:
{
  "career_paths": [
    {
      "title": "<role title, e.g. Frontend Developer>",
      "description": "<1-2 sentence description of the role>",
      "key_skills": ["<skill 1>", "<skill 2>", "<skill 3>", "<skill 4>", "<skill 5>"],
      "match_percentage": <number 0-100 based on current skill alignment>,
      "skills_to_improve": ["<specific skill gap 1>", "<specific skill gap 2>", "<specific skill gap 3>"],
      "learning_suggestions": ["<actionable recommendation 1>", "<actionable recommendation 2>"]
    }
  ]
}

Rules:
- match_percentage should realistically reflect how many of the key_skills the candidate already has
- skills_to_improve should be specific and actionable
- learning_suggestions should be practical steps the candidate can take
- Sort paths by match_percentage descending (best match first)
- Choose diverse but realistic career paths based on the candidate's actual skills`;

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
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse career path suggestions');
    }

    if (!result.career_paths || !Array.isArray(result.career_paths)) {
      throw new Error('Invalid response structure');
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Career path suggestion error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate suggestions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
