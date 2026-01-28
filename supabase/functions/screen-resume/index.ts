import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResumeData {
  skills: string[];
  experience_years: number;
  education: string;
  summary: string;
}

interface ScreeningResult {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  analysis: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { resumeText, resumeId, jobId } = await req.json();
    
    console.log("Processing resume screening request", { resumeId, jobId });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If jobId is provided, fetch job requirements for matching
    let jobRequirements = null;
    if (jobId) {
      const { data: job, error: jobError } = await supabase
        .from("job_requirements")
        .select("*")
        .eq("id", jobId)
        .single();
      
      if (jobError) {
        console.error("Error fetching job:", jobError);
      } else {
        jobRequirements = job;
      }
    }

    // Step 1: Parse resume to extract skills, experience, education
    const parsePrompt = `Analyze the following resume text and extract structured information.

Resume Text:
${resumeText}

Extract and return a JSON object with these fields:
- skills: array of technical and soft skills found (be comprehensive)
- experience_years: estimated total years of professional experience (number)
- education: highest education level and field (e.g., "Bachelor's in Computer Science")
- summary: a 2-3 sentence professional summary

Return ONLY valid JSON, no markdown.`;

    console.log("Calling AI to parse resume...");
    
    const parseResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert resume parser. Extract structured data from resumes accurately. Always return valid JSON." },
          { role: "user", content: parsePrompt },
        ],
      }),
    });

    if (!parseResponse.ok) {
      if (parseResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (parseResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${parseResponse.status}`);
    }

    const parseResult = await parseResponse.json();
    const parseContent = parseResult.choices?.[0]?.message?.content || "";
    
    console.log("Raw parse response:", parseContent);

    // Clean and parse the JSON response
    let resumeData: ResumeData;
    try {
      const cleanedJson = parseContent.replace(/```json\n?|\n?```/g, "").trim();
      resumeData = JSON.parse(cleanedJson);
    } catch (e) {
      console.error("Failed to parse resume data:", e);
      resumeData = {
        skills: [],
        experience_years: 0,
        education: "Unknown",
        summary: "Unable to parse resume",
      };
    }

    console.log("Parsed resume data:", resumeData);

    // Update resume record with parsed data
    if (resumeId) {
      const { error: updateError } = await supabase
        .from("resumes")
        .update({
          skills: resumeData.skills,
          experience_years: resumeData.experience_years,
          education: resumeData.education,
          summary: resumeData.summary,
          parsed_data: resumeData,
        })
        .eq("id", resumeId);

      if (updateError) {
        console.error("Error updating resume:", updateError);
      }
    }

    // Step 2: If job requirements provided, perform matching
    let screeningResult: ScreeningResult | null = null;
    
    if (jobRequirements) {
      const matchPrompt = `Compare a candidate's resume against job requirements and provide a match assessment.

Candidate Skills: ${JSON.stringify(resumeData.skills)}
Candidate Experience: ${resumeData.experience_years} years
Candidate Education: ${resumeData.education}

Job Requirements:
- Title: ${jobRequirements.title}
- Required Skills: ${JSON.stringify(jobRequirements.required_skills)}
- Minimum Experience: ${jobRequirements.min_experience_years} years
- Description: ${jobRequirements.description || "N/A"}

Provide a JSON response with:
- match_score: overall match percentage (0-100)
- matched_skills: array of skills the candidate has that match requirements
- missing_skills: array of required skills the candidate lacks
- analysis: 2-3 sentence analysis of the candidate's fit for this role

Return ONLY valid JSON, no markdown.`;

      console.log("Calling AI for job matching...");

      const matchResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are an expert HR recruiter. Evaluate candidate fit accurately and fairly." },
            { role: "user", content: matchPrompt },
          ],
        }),
      });

      if (matchResponse.ok) {
        const matchResult = await matchResponse.json();
        const matchContent = matchResult.choices?.[0]?.message?.content || "";
        
        try {
          const cleanedJson = matchContent.replace(/```json\n?|\n?```/g, "").trim();
          screeningResult = JSON.parse(cleanedJson);
          
          // Save screening result to database
          const { error: screenError } = await supabase
            .from("screening_results")
            .upsert({
              resume_id: resumeId,
              job_id: jobId,
              match_score: screeningResult!.match_score,
              matched_skills: screeningResult!.matched_skills,
              missing_skills: screeningResult!.missing_skills,
              analysis: screeningResult!.analysis,
            }, {
              onConflict: "resume_id,job_id",
            });

          if (screenError) {
            console.error("Error saving screening result:", screenError);
          }
        } catch (e) {
          console.error("Failed to parse matching result:", e);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        resumeData,
        screeningResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in screen-resume function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
