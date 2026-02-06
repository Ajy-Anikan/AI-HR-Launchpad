import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Video, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScheduleInterviewDialogProps {
  candidateId: string;
  hrUserId: string;
  anonymizedId: string;
  onScheduled?: () => void;
  children?: React.ReactNode;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

export function ScheduleInterviewDialog({
  candidateId,
  hrUserId,
  anonymizedId,
  onScheduled,
  children,
}: ScheduleInterviewDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [interviewType, setInterviewType] = useState<string>("");
  const [interviewMode, setInterviewMode] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setInterviewType("");
    setInterviewMode("");
    setDate(undefined);
    setTime("");
    setNotes("");
  };

  const handleSchedule = async () => {
    if (!interviewType || !interviewMode || !date || !time) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("interview_schedules")
        .insert({
          candidate_id: candidateId,
          hr_user_id: hrUserId,
          interview_type: interviewType,
          interview_mode: interviewMode,
          scheduled_date: format(date, "yyyy-MM-dd"),
          scheduled_time: time,
          hr_notes: notes || null,
        });

      if (error) throw error;

      toast({
        title: "Interview scheduled",
        description: `Interview scheduled for ${format(date, "PPP")} at ${time}`,
      });

      resetForm();
      setOpen(false);
      onScheduled?.();
    } catch (error) {
      console.error("Error scheduling interview:", error);
      toast({
        title: "Error",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = interviewType && interviewMode && date && time;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Schedule Interview
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Schedule an interview for candidate <span className="font-mono font-medium">{anonymizedId}</span>.
            This is for coordination only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Interview Type */}
          <div className="space-y-2">
            <Label>Interview Type *</Label>
            <Select value={interviewType} onValueChange={setInterviewType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interview Mode */}
          <div className="space-y-2">
            <Label>Mode *</Label>
            <Select value={interviewMode} onValueChange={setInterviewMode}>
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">
                  <span className="flex items-center gap-2">
                    <Video className="h-4 w-4" /> Online
                  </span>
                </SelectItem>
                <SelectItem value="in_person">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> In-person
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label>Time *</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* HR Notes (optional) */}
          <div className="space-y-2">
            <Label>
              Interview Notes <span className="text-muted-foreground text-xs">(internal, HR only)</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any internal notes about this interview..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={!isFormValid || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Schedule Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
