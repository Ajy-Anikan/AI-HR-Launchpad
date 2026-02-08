import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, AlertTriangle } from "lucide-react";

type AssessmentRating = "good" | "average" | "needs_improvement";
type Recommendation = "proceed" | "hold" | "do_not_proceed";

interface InterviewFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interviewId: string;
  candidateId: string;
  hrUserId: string;
  interviewType: string;
  onFeedbackSaved: () => void;
}

interface FeedbackData {
  overall_impression: string;
  technical_assessment: AssessmentRating;
  communication_assessment: AssessmentRating;
  cultural_fit_assessment: AssessmentRating;
  key_strengths: string;
  key_concerns: string;
  recommendation: Recommendation;
}

const assessmentLabels: Record<AssessmentRating, string> = {
  good: "Good",
  average: "Average",
  needs_improvement: "Needs Improvement",
};

const recommendationLabels: Record<Recommendation, string> = {
  proceed: "Proceed to Next Round",
  hold: "Hold for Review",
  do_not_proceed: "Do Not Proceed",
};

const typeLabels: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  hr: "HR",
};

export function InterviewFeedbackDialog({
  open,
  onOpenChange,
  interviewId,
  candidateId,
  hrUserId,
  interviewType,
  onFeedbackSaved,
}: InterviewFeedbackDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [form, setForm] = useState<FeedbackData>({
    overall_impression: "",
    technical_assessment: "average",
    communication_assessment: "average",
    cultural_fit_assessment: "average",
    key_strengths: "",
    key_concerns: "",
    recommendation: "hold",
  });

  useEffect(() => {
    if (open && interviewId) {
      loadExistingFeedback();
    }
  }, [open, interviewId]);

  const loadExistingFeedback = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("interview_feedback")
        .select("*")
        .eq("interview_id", interviewId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingId(data.id);
        setForm({
          overall_impression: data.overall_impression,
          technical_assessment: data.technical_assessment as AssessmentRating,
          communication_assessment: data.communication_assessment as AssessmentRating,
          cultural_fit_assessment: data.cultural_fit_assessment as AssessmentRating,
          key_strengths: data.key_strengths || "",
          key_concerns: data.key_concerns || "",
          recommendation: data.recommendation as Recommendation,
        });
      } else {
        setExistingId(null);
        setForm({
          overall_impression: "",
          technical_assessment: "average",
          communication_assessment: "average",
          cultural_fit_assessment: "average",
          key_strengths: "",
          key_concerns: "",
          recommendation: "hold",
        });
      }
    } catch (error) {
      console.error("Error loading feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.overall_impression.trim()) {
      toast({
        title: "Required",
        description: "Please provide an overall impression.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (existingId) {
        const { error } = await supabase
          .from("interview_feedback")
          .update({
            overall_impression: form.overall_impression.trim(),
            technical_assessment: form.technical_assessment,
            communication_assessment: form.communication_assessment,
            cultural_fit_assessment: form.cultural_fit_assessment,
            key_strengths: form.key_strengths.trim() || null,
            key_concerns: form.key_concerns.trim() || null,
            recommendation: form.recommendation,
          })
          .eq("id", existingId);

        if (error) throw error;
        toast({ title: "Updated", description: "Feedback has been updated." });
      } else {
        const { error } = await supabase.from("interview_feedback").insert({
          interview_id: interviewId,
          candidate_id: candidateId,
          hr_user_id: hrUserId,
          overall_impression: form.overall_impression.trim(),
          technical_assessment: form.technical_assessment,
          communication_assessment: form.communication_assessment,
          cultural_fit_assessment: form.cultural_fit_assessment,
          key_strengths: form.key_strengths.trim() || null,
          key_concerns: form.key_concerns.trim() || null,
          recommendation: form.recommendation,
        });

        if (error) throw error;
        toast({ title: "Saved", description: "Feedback has been recorded." });
      }

      onFeedbackSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast({
        title: "Error",
        description: "Failed to save feedback.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const AssessmentSelect = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: AssessmentRating;
    onChange: (v: AssessmentRating) => void;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as AssessmentRating)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(assessmentLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {existingId ? "Edit" : "Submit"} Interview Feedback
          </DialogTitle>
          <DialogDescription>
            Record structured feedback for this completed interview.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Interview Type (read-only) */}
            <div className="space-y-2">
              <Label>Interview Type</Label>
              <div>
                <Badge variant="outline" className="text-sm">
                  {typeLabels[interviewType] || interviewType}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Overall Impression */}
            <div className="space-y-2">
              <Label htmlFor="overall_impression">
                Overall Impression <span className="text-destructive">*</span>
              </Label>
              <Input
                id="overall_impression"
                placeholder="Brief summary of the candidate's performance..."
                value={form.overall_impression}
                onChange={(e) =>
                  setForm((f) => ({ ...f, overall_impression: e.target.value }))
                }
                maxLength={500}
              />
            </div>

            <Separator />

            {/* Assessment Ratings */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Assessment Ratings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AssessmentSelect
                  label="Technical"
                  value={form.technical_assessment}
                  onChange={(v) => setForm((f) => ({ ...f, technical_assessment: v }))}
                />
                <AssessmentSelect
                  label="Communication"
                  value={form.communication_assessment}
                  onChange={(v) => setForm((f) => ({ ...f, communication_assessment: v }))}
                />
                <AssessmentSelect
                  label="Cultural / Behavioral Fit"
                  value={form.cultural_fit_assessment}
                  onChange={(v) => setForm((f) => ({ ...f, cultural_fit_assessment: v }))}
                />
              </div>
            </div>

            <Separator />

            {/* Strengths & Concerns */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Strengths & Concerns</h4>
              <div className="space-y-2">
                <Label htmlFor="key_strengths">Key Strengths Observed</Label>
                <Textarea
                  id="key_strengths"
                  placeholder="Notable strengths demonstrated during the interview..."
                  value={form.key_strengths}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, key_strengths: e.target.value }))
                  }
                  maxLength={2000}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key_concerns">Key Concerns or Gaps</Label>
                <Textarea
                  id="key_concerns"
                  placeholder="Areas of concern or gaps identified..."
                  value={form.key_concerns}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, key_concerns: e.target.value }))
                  }
                  maxLength={2000}
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Recommendation */}
            <div className="space-y-2">
              <Label>Recommendation</Label>
              <Select
                value={form.recommendation}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, recommendation: v as Recommendation }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(recommendationLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Internal recommendation (not final decision)
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : existingId ? "Update Feedback" : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
