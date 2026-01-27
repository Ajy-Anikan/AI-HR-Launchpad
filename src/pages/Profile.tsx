import { User, Mail, Briefcase, MapPin, Calendar, Edit2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const skills = ["React", "TypeScript", "Node.js", "Python", "AWS", "System Design"];

export default function Profile() {
  return (
    <div className="container py-8 max-w-4xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarFallback className="gradient-primary text-primary-foreground text-2xl">
                AJ
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Alex Johnson</h1>
                  <p className="text-muted-foreground">Senior Software Engineer</p>
                </div>
                <Button variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  alex@example.com
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  San Francisco, CA
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined Jan 2024
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Your tracked skills and expertise</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Stats</CardTitle>
            <CardDescription>Your platform activity summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">12</p>
                <p className="text-sm text-muted-foreground">Interviews</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">85%</p>
                <p className="text-sm text-muted-foreground">Resume Score</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">8</p>
                <p className="text-sm text-muted-foreground">Skills</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">5</p>
                <p className="text-sm text-muted-foreground">Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates about your activity</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Privacy Settings</p>
                <p className="text-sm text-muted-foreground">Control who can see your profile</p>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Connected Accounts</p>
                <p className="text-sm text-muted-foreground">Link your social and professional accounts</p>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
