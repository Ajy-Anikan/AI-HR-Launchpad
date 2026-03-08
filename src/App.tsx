import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CandidateDashboard from "./pages/CandidateDashboard";
import HRDashboard from "./pages/HRDashboard";
import CandidateProfile from "./pages/CandidateProfile";
import MockInterview from "./pages/MockInterview";
import InterviewEvaluation from "./pages/InterviewEvaluation";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import SkillTracker from "./pages/SkillTracker";
import CompanyPrepHub from "./pages/CompanyPrepHub";
import Profile from "./pages/Profile";
import HRInterviews from "./pages/HRInterviews";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import HRPipeline from "./pages/HRPipeline";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
              <Route path="/hr-dashboard" element={<HRDashboard />} />
              <Route path="/candidate-profile/:candidateId" element={<CandidateProfile />} />
              <Route path="/hr-interviews" element={<HRInterviews />} />
              <Route path="/hr-pipeline" element={<HRPipeline />} />
              <Route path="/mock-interview" element={<MockInterview />} />
              <Route path="/interview-evaluation" element={<InterviewEvaluation />} />
              <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
              <Route path="/skill-tracker" element={<SkillTracker />} />
              <Route path="/company-prep" element={<CompanyPrepHub />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
