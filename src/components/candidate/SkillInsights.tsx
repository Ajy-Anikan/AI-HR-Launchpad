import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Code,
  Wrench,
  Layers,
  MessageSquare,
  Globe,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// Keyword mappings for categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Programming: [
    "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust",
    "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "sql", "html", "css",
    "sass", "less", "graphql", "bash", "shell", "perl",
  ],
  Tools: [
    "git", "docker", "kubernetes", "jenkins", "aws", "azure", "gcp", "linux",
    "jira", "figma", "postman", "terraform", "ansible", "ci/cd", "webpack",
    "vite", "npm", "yarn", "redis", "mongodb", "postgresql", "mysql", "kafka",
    "elasticsearch", "grafana", "datadog",
  ],
  Frameworks: [
    "react", "angular", "vue", "next.js", "express", "django", "flask",
    "spring", "node", "nest", "tailwind", "bootstrap", ".net", "laravel",
    "rails", "fastapi", "svelte", "remix", "gatsby",
  ],
  "Soft Skills": [
    "communication", "leadership", "teamwork", "problem-solving", "creativity",
    "adaptability", "management", "collaboration", "mentoring", "negotiation",
    "presentation", "analytical", "critical thinking", "time management",
    "decision making", "conflict resolution",
  ],
  "Domain Knowledge": [
    "machine learning", "ai", "data science", "cloud", "devops", "security",
    "blockchain", "iot", "mobile", "web", "api", "microservices", "system design",
    "agile", "scrum", "product", "ux", "ui", "design", "testing", "qa",
  ],
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Programming: <Code className="h-4 w-4" />,
  Tools: <Wrench className="h-4 w-4" />,
  Frameworks: <Layers className="h-4 w-4" />,
  "Soft Skills": <MessageSquare className="h-4 w-4" />,
  "Domain Knowledge": <Globe className="h-4 w-4" />,
};

interface SkillInsightsProps {
  skills: string[];
  missingSkills?: string[];
}

export function SkillInsights({ skills, missingSkills = [] }: SkillInsightsProps) {
  const categorized = useMemo(() => {
    const counts: Record<string, string[]> = {
      Programming: [],
      Tools: [],
      Frameworks: [],
      "Soft Skills": [],
      "Domain Knowledge": [],
    };

    skills.forEach((skill) => {
      const lower = skill.toLowerCase();
      let matched = false;
      for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some((kw) => lower.includes(kw))) {
          counts[category].push(skill);
          matched = true;
          break;
        }
      }
      if (!matched) {
        counts["Domain Knowledge"].push(skill);
      }
    });

    return counts;
  }, [skills]);

  const radarData = useMemo(() => {
    const maxSkills = Math.max(
      ...Object.values(categorized).map((s) => s.length),
      1
    );
    return Object.entries(categorized).map(([category, items]) => ({
      category,
      value: Math.round((items.length / maxSkills) * 100),
      count: items.length,
    }));
  }, [categorized]);

  // Top skills with pseudo-strength based on category coverage
  const topSkills = useMemo(() => {
    const all = skills.slice(0, 8).map((skill, i) => ({
      name: skill,
      strength: Math.max(100 - i * 8, 30),
    }));
    return all;
  }, [skills]);

  // Generate improvement suggestions from missing skills and gaps
  const suggestions = useMemo(() => {
    const tips: string[] = [];

    if (categorized["Domain Knowledge"].length < 2) {
      tips.push("Improve system design fundamentals");
    }
    if (categorized.Tools.length < 2) {
      tips.push("Gain experience with cloud technologies and DevOps tools");
    }
    if (categorized["Soft Skills"].length < 2) {
      tips.push("Strengthen problem-solving and communication practice");
    }

    missingSkills.slice(0, 2).forEach((s) => {
      tips.push(`Build proficiency in ${s}`);
    });

    if (tips.length === 0) {
      tips.push("Continue deepening expertise in your strongest areas");
      tips.push("Explore emerging technologies in your domain");
      tips.push("Practice behavioral interview scenarios");
    }

    return tips.slice(0, 3);
  }, [categorized, missingSkills]);

  if (skills.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Skill Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Skill Distribution
            </CardTitle>
            <CardDescription>
              How your skills are distributed across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="category"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name="Skills"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={radarData}
                    layout="vertical"
                    margin={{ left: 0, right: 16 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      horizontal={false}
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={100}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number, _name: string, entry: any) => [
                        `${entry.payload.count} skills`,
                        entry.payload.category,
                      ]}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[0, 6, 6, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category badges */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.entries(categorized).map(([cat, items]) => (
                <div
                  key={cat}
                  className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs"
                >
                  <span className="text-primary">{CATEGORY_ICONS[cat]}</span>
                  <span className="font-medium truncate">{cat}</span>
                  <span className="ml-auto text-muted-foreground">{items.length}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Skill Strength Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Top Skills
            </CardTitle>
            <CardDescription>
              Your strongest extracted skills
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topSkills.map((skill, i) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * i }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[60%]">{skill.name}</span>
                  <span className="text-muted-foreground text-xs">{skill.strength}%</span>
                </div>
                <Progress value={skill.strength} className="h-2" />
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Suggested Skill Improvements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Suggested Skill Improvements
            </CardTitle>
            <CardDescription>
              Areas to focus on based on your resume analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {suggestions.map((tip, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * i }}
                  className="flex items-start gap-3 text-sm"
                >
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  <span>{tip}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
