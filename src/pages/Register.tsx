import { Link } from "react-router-dom";
import { BrainCircuit, Mail, Lock, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Register() {
  const [role, setRole] = useState("candidate");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement register logic
  };

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border bg-card p-8 shadow-medium">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl gradient-primary shadow-glow mb-4">
              <BrainCircuit className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="text-muted-foreground mt-2">
              Join AI-HR Assistant today
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label>I am a...</Label>
              <RadioGroup
                value={role}
                onValueChange={setRole}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="candidate"
                    id="candidate"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="candidate"
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                      role === "candidate" && "border-primary bg-primary/5"
                    )}
                  >
                    <User className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">Candidate</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="hr"
                    id="hr"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="hr"
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                      role === "hr" && "border-primary bg-primary/5"
                    )}
                  >
                    <Building2 className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">HR Professional</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <Button type="submit" className="w-full gradient-primary border-0 shadow-glow">
              Create Account
            </Button>
          </form>

          {/* Terms */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By signing up, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
