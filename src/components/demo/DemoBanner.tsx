import { motion, AnimatePresence } from "framer-motion";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/contexts/DemoContext";
import { useNavigate } from "react-router-dom";

export function DemoBanner() {
  const { isDemoMode, endDemo, tourActive, startTour } = useDemo();
  const navigate = useNavigate();

  if (!isDemoMode || tourActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        className="sticky top-16 z-40 w-full border-b bg-primary/5 backdrop-blur-sm"
      >
        <div className="container flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Demo Mode</span>
            <span className="text-muted-foreground hidden sm:inline">— Exploring with sample data</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={startTour}>
              Restart Tour
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => { endDemo(); navigate("/"); }}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Exit Demo
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
