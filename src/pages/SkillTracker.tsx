import { Target, Plus, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const skills = [
  { name: "React", category: "Frontend", progress: 85, level: "Advanced" },
  { name: "TypeScript", category: "Languages", progress: 70, level: "Intermediate" },
  { name: "Node.js", category: "Backend", progress: 65, level: "Intermediate" },
  { name: "Python", category: "Languages", progress: 55, level: "Intermediate" },
  { name: "AWS", category: "Cloud", progress: 40, level: "Beginner" },
  { name: "System Design", category: "Architecture", progress: 50, level: "Intermediate" },
];

const categories = ["All", "Frontend", "Backend", "Languages", "Cloud", "Architecture"];

export default function SkillTracker() {
  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Skill Tracker</h1>
          <p className="text-muted-foreground">
            Track your progress and identify areas for improvement.
          </p>
        </div>
        <Button className="gradient-primary border-0 shadow-glow">
          <Plus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category, index) => (
          <Button
            key={category}
            variant={index === 0 ? "default" : "outline"}
            size="sm"
            className={index === 0 ? "gradient-primary border-0" : ""}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Skills Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skills.map((skill) => (
          <Card key={skill.name} className="card-hover">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{skill.name}</CardTitle>
                  <CardDescription>{skill.category}</CardDescription>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {skill.level}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{skill.progress}%</span>
                </div>
                <Progress value={skill.progress} className="h-2" />
              </div>
              <div className="mt-4 flex items-center text-xs text-emerald-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5% this month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
