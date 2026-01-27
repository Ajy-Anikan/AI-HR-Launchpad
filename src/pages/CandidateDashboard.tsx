import { 
  BrainCircuit, 
  FileText, 
  Target, 
  Building2, 
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

const quickActions = [
  { icon: BrainCircuit, label: "Start Interview", path: "/mock-interview", color: "bg-primary/10 text-primary" },
  { icon: FileText, label: "Analyze Resume", path: "/resume-analyzer", color: "bg-accent/10 text-accent" },
  { icon: Building2, label: "Company Research", path: "/company-prep", color: "bg-emerald-100 text-emerald-600" },
  { icon: Target, label: "Track Skills", path: "/skill-tracker", color: "bg-violet-100 text-violet-600" },
];

const upcomingInterviews = [
  { company: "TechCorp Inc.", role: "Senior Developer", date: "Tomorrow, 2:00 PM", status: "confirmed" },
  { company: "Innovate Labs", role: "Full Stack Engineer", date: "Jan 15, 10:00 AM", status: "pending" },
];

const recentActivity = [
  { icon: CheckCircle2, text: "Completed Mock Interview for React Developer", time: "2 hours ago" },
  { icon: FileText, text: "Resume analyzed - Score: 85/100", time: "Yesterday" },
  { icon: Target, text: "Added new skill: TypeScript", time: "2 days ago" },
];

export default function CandidateDashboard() {
  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, Alex!</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your job search.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            to={action.path}
            className="group"
          >
            <Card className="card-hover h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className={`h-12 w-12 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="font-medium text-sm">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">Mock Interviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">85%</p>
                    <p className="text-sm text-muted-foreground">Resume Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Target className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">8</p>
                    <p className="text-sm text-muted-foreground">Skills Tracked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skill Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Progress</CardTitle>
              <CardDescription>Your top skills and proficiency levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "React", progress: 85 },
                { name: "TypeScript", progress: 70 },
                { name: "Node.js", progress: 65 },
                { name: "System Design", progress: 50 },
              ].map((skill) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-muted-foreground">{skill.progress}%</span>
                  </div>
                  <Progress value={skill.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Interviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Interviews
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingInterviews.map((interview, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                    {interview.company.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{interview.company}</p>
                    <p className="text-xs text-muted-foreground">{interview.role}</p>
                    <p className="text-xs text-muted-foreground mt-1">{interview.date}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" size="sm">
                View All
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <activity.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
