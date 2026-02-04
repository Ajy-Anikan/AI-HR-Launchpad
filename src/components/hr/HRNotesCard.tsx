import { useState } from "react";
import { StickyNote, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HRNotesCardProps {
  candidateId: string;
  hrUserId: string;
  initialNote: string;
}

export function HRNotesCard({ candidateId, hrUserId, initialNote }: HRNotesCardProps) {
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(initialNote ? "Previously saved" : null);
  const { toast } = useToast();

  const handleSaveNote = async () => {
    if (!note.trim()) {
      toast({
        title: "Empty note",
        description: "Please enter a note before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("hr_candidate_notes")
        .upsert(
          {
            hr_user_id: hrUserId,
            candidate_id: candidateId,
            note_text: note.trim(),
          },
          { onConflict: "hr_user_id,candidate_id" }
        );

      if (error) throw error;

      setLastSaved("Just now");
      toast({
        title: "Note saved",
        description: "Your private note has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Failed to save",
        description: "There was an error saving your note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          HR Notes
          <span className="text-xs font-normal text-muted-foreground ml-2">(Private)</span>
        </CardTitle>
        <CardDescription>
          Add private notes about this candidate. Notes are visible only to you and do not affect candidate data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Add your private notes about this candidate..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[120px] resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {lastSaved && `Last saved: ${lastSaved}`}
          </span>
          <Button onClick={handleSaveNote} disabled={saving} size="sm">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
