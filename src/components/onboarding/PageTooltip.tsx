import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageTooltipProps {
  tooltipKey: string;
  message: string;
  position?: "top" | "bottom";
}

export function PageTooltip({ tooltipKey, message, position = "top" }: PageTooltipProps) {
  const storageKey = `tooltip_dismissed_${tooltipKey}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    const onboarded = localStorage.getItem("onboarding_completed");
    if (onboarded && !dismissed) {
      // Small delay so it appears after page renders
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(storageKey, "true");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? -8 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === "top" ? -8 : 8 }}
          transition={{ duration: 0.25 }}
          className="mb-4 flex items-start gap-3 rounded-xl border bg-card p-4 shadow-soft"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Lightbulb className="h-4 w-4" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pt-1 flex-1">
            {message}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            onClick={dismiss}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
