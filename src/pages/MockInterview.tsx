import { BrainCircuit, Play, Clock, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const interviewTypes = [
  {
    title: "Technical Interview",
    description: "Practice coding, system design, and technical problem-solving questions.",
    duration: "45 min",
    difficulty: "Advanced",
    icon: "💻",
  },
  {
    title: "Behavioral Interview",
    description: "Master the STAR method and common behavioral questions.",
    duration: "30 min",
    difficulty: "Intermediate",
    icon: "🎯",
  },
  {
    title: "Case Study",
    description: "Work through business cases and analytical problems.",
    duration: "60 min",
    difficulty: "Advanced",
    icon: "📊",
  },
  {
    title: "HR Screening",
    description: "Prepare for initial HR calls and general questions.",
    duration: "20 min",
    difficulty: "Beginner",
    icon: "👋",
  },
];

export default function MockInterview() {
  return (
    <div className="container py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow mb-4">
          <BrainCircuit className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Mock Interview</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Practice with AI-powered interview simulations. Get real-time feedback and improve your performance.
        </p>
      </div>

      {/* Interview Types Grid */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {interviewTypes.map((type) => (
          <Card key={type.title} className="card-hover group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <span className="text-4xl">{type.icon}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {type.duration}
                </div>
              </div>
              <CardTitle className="mt-4">{type.title}</CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted">
                  {type.difficulty}
                </span>
                <Button size="sm" className="gradient-primary border-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon Features */}
      <div className="mt-16 text-center">
        <h2 className="text-xl font-semibold mb-4">AI Features Coming Soon</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {["Real-time feedback", "Voice analysis", "Body language tips", "Industry-specific questions"].map((feature) => (
            <span key={feature} className="px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground">
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
