import { useState, useEffect, useCallback } from "react";
import { Timer, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewTimerProps {
  totalSeconds: number;
  isActive: boolean;
  onTimeUp: () => void;
}

export function InterviewTimer({ totalSeconds, isActive, onTimeUp }: InterviewTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!isActive || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, secondsLeft <= 0, onTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = (secondsLeft / totalSeconds) * 100;
  const isLow = secondsLeft <= 30;
  const isCritical = secondsLeft <= 10;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
        isCritical
          ? "border-destructive/50 bg-destructive/10"
          : isLow
          ? "border-yellow-500/50 bg-yellow-500/10"
          : "border-border bg-muted/30"
      )}
    >
      {isCritical ? (
        <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
      ) : (
        <Timer className={cn("h-5 w-5", isLow ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground")} />
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              "text-sm font-medium",
              isCritical ? "text-destructive" : isLow ? "text-yellow-600 dark:text-yellow-400" : "text-foreground"
            )}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground">
            {isCritical ? "Almost up!" : isLow ? "Hurry up" : "Time remaining"}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              isCritical ? "bg-destructive" : isLow ? "bg-yellow-500" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
