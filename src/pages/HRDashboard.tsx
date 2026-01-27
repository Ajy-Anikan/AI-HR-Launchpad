import { 
  Users, 
  Briefcase, 
  Calendar, 
  TrendingUp,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const stats = [
  { icon: Users, label: "Total Candidates", value: "1,234", change: "+12%", color: "bg-primary/10 text-primary" },
  { icon: Briefcase, label: "Open Positions", value: "23", change: "+3", color: "bg-emerald-100 text-emerald-600" },
  { icon: Calendar, label: "Interviews Today", value: "8", change: "", color: "bg-violet-100 text-violet-600" },
  { icon: TrendingUp, label: "Hire Rate", value: "68%", change: "+5%", color: "bg-accent/10 text-accent" },
];

const recentCandidates = [
  { name: "Sarah Johnson", role: "Senior Developer", status: "screening", score: 92 },
  { name: "Michael Chen", role: "Product Manager", status: "interview", score: 88 },
  { name: "Emily Davis", role: "UX Designer", status: "offer", score: 95 },
  { name: "James Wilson", role: "Data Analyst", status: "rejected", score: 65 },
  { name: "Anna Martinez", role: "DevOps Engineer", status: "screening", score: 78 },
];

const upcomingInterviews = [
  { candidate: "David Kim", role: "Frontend Developer", time: "10:00 AM", interviewer: "John Smith" },
  { candidate: "Lisa Brown", role: "Backend Engineer", time: "2:00 PM", interviewer: "Sarah Lee" },
  { candidate: "Tom Wilson", role: "Full Stack Developer", time: "4:30 PM", interviewer: "Mike Johnson" },
];

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    screening: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    interview: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    offer: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    rejected: "bg-red-100 text-red-700 hover:bg-red-100",
  };
  return styles[status] || "";
};

export default function HRDashboard() {
  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">HR Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your recruitment pipeline efficiently.
          </p>
        </div>
        <Button className="gradient-primary border-0 shadow-glow">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Candidate
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                {stat.change && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold mt-4">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Candidates */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Candidates</CardTitle>
                <CardDescription>Latest applications and their status</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCandidates.map((candidate, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="gradient-primary text-primary-foreground text-sm">
                          {candidate.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{candidate.name}</p>
                        <p className="text-sm text-muted-foreground">{candidate.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">Score: {candidate.score}</p>
                      </div>
                      <Badge className={getStatusBadge(candidate.status)}>
                        {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Interviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Interviews
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingInterviews.map((interview, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{interview.candidate}</p>
                      <span className="text-xs font-medium text-primary">{interview.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{interview.role}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      with {interview.interviewer}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Screening</span>
                </div>
                <span className="font-medium">45</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Interview</span>
                </div>
                <span className="font-medium">28</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">Offer</span>
                </div>
                <span className="font-medium">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">Hired</span>
                </div>
                <span className="font-medium text-emerald-600">8</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Rejected</span>
                </div>
                <span className="font-medium text-red-500">23</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
