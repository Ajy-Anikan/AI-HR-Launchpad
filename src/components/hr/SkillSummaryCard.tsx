import { Code, MessageSquare, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SkillSummaryCardProps {
  technicalSkills: string[];
  softSkills: string[];
  experienceYears: number | null;
}

// Common soft skills to filter from technical skills
const SOFT_SKILLS = [
  "communication", "teamwork", "leadership", "problem-solving", "problem solving",
  "critical thinking", "creativity", "adaptability", "time management", "collaboration",
  "presentation", "negotiation", "conflict resolution", "emotional intelligence",
  "interpersonal", "mentoring", "coaching", "decision making", "decision-making"
];

export function SkillSummaryCard({
  technicalSkills,
  softSkills,
  experienceYears,
}: SkillSummaryCardProps) {
  // Filter skills into technical and soft
  const filteredTechnicalSkills = technicalSkills.filter(
    skill => !SOFT_SKILLS.some(soft => skill.toLowerCase().includes(soft))
  );
  const extractedSoftSkills = technicalSkills.filter(
    skill => SOFT_SKILLS.some(soft => skill.toLowerCase().includes(soft))
  );
  const allSoftSkills = [...new Set([...softSkills, ...extractedSoftSkills])];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Skill Summary
        </CardTitle>
        <CardDescription>
          Extracted from resume and practice sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Technical Skills */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Technical Skills</span>
          </div>
          {filteredTechnicalSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {filteredTechnicalSkills.slice(0, 12).map((skill, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {filteredTechnicalSkills.length > 12 && (
                <Badge variant="outline" className="text-xs">
                  +{filteredTechnicalSkills.length - 12} more
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No technical skills listed</span>
          )}
        </div>

        <Separator />

        {/* Soft Skills */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Soft Skills</span>
          </div>
          {allSoftSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {allSoftSkills.slice(0, 8).map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {allSoftSkills.length > 8 && (
                <Badge variant="secondary" className="text-xs">
                  +{allSoftSkills.length - 8} more
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No soft skills listed</span>
          )}
        </div>

        <Separator />

        {/* Experience */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Experience</span>
          </div>
          <span className="font-semibold">
            {experienceYears !== null ? `${experienceYears} years` : "Not specified"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
