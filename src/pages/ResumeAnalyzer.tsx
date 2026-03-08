import { useState, useCallback, useEffect } from "react";
import { PageTooltip } from "@/components/onboarding/PageTooltip";
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, X, FileUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SkillInsights } from "@/components/candidate/SkillInsights";
import ResumeImprovements from "@/components/candidate/ResumeImprovements";

interface ResumeData {
  skills: string[];
  experience_years: number;
  education: string;
  summary: string;
}

interface Resume {
  id: string;
  file_name: string;
  uploaded_at: string;
  skills: string[] | null;
  experience_years: number | null;
  education: string | null;
  summary: string | null;
}

export default function ResumeAnalyzer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [existingResume, setExistingResume] = useState<Resume | null>(null);

  const fetchExistingResume = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setExistingResume(data as Resume);
        if (data.skills) {
          setResumeData({
            skills: data.skills,
            experience_years: data.experience_years || 0,
            education: data.education || "",
            summary: data.summary || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching existing resume:", error);
    }
  }, [user]);

  // Fetch existing resume on mount
  useEffect(() => {
    if (user) {
      fetchExistingResume();
    }
  }, [user, fetchExistingResume]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  }, []);

  const validateAndSetFile = (file: File) => {
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, DOCX, or TXT file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setResumeData(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    // For demo purposes, we'll read text files directly
    // In production, you'd want to use a proper PDF parser
    if (file.type === "text/plain") {
      return await file.text();
    }
    
    // For PDF/DOC files, we'll send a placeholder message
    // Real implementation would use a PDF parsing library
    return `Resume file: ${file.name}\n\nThis is a placeholder for parsed content. In production, use a PDF parsing service to extract text from ${file.type} files.`;
  };

  const uploadAndAnalyze = async () => {
    if (!selectedFile || !user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to upload a resume.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // 1. Upload file to storage
      const filePath = `${user.id}/${Date.now()}-${selectedFile.name}`;
      
      setUploadProgress(30);
      
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // 2. Create resume record
      const { data: resumeRecord, error: insertError } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          content_type: selectedFile.type,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploadProgress(70);
      setIsUploading(false);
      setIsAnalyzing(true);

      // 3. Extract text and analyze with AI
      const resumeText = await extractTextFromFile(selectedFile);

      const { data, error: fnError } = await supabase.functions.invoke("screen-resume", {
        body: {
          resumeText,
          resumeId: resumeRecord.id,
        },
      });

      if (fnError) throw fnError;

      setUploadProgress(100);

      if (data.resumeData) {
        setResumeData(data.resumeData);
        setExistingResume({
          ...resumeRecord,
          skills: data.resumeData.skills,
          experience_years: data.resumeData.experience_years,
          education: data.resumeData.education,
          summary: data.resumeData.summary,
        } as Resume);
      }

      toast({
        title: "Resume analyzed!",
        description: "Your resume has been uploaded and analyzed successfully.",
      });

      setSelectedFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload resume",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
  };

  if (!user) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">
              Please log in as a candidate to upload and analyze your resume.
            </p>
            <Button asChild className="gradient-primary border-0">
              <a href="/login">Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <PageTooltip
        tooltipKey="resume_analyzer"
        message="Upload your resume here to extract skills, experience, and receive AI-powered insights aligned with job requirements."
      />
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent mb-4">
          <FileText className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Resume Analyzer</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Upload your resume and get instant AI-powered feedback to improve your chances.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Upload Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload your resume</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop or click to upload. Supports PDF, DOC, DOCX, and TXT.
                </p>
                <Button className="gradient-primary border-0">Select File</Button>
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selected file display */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearSelection}
                    disabled={isUploading || isAnalyzing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress bar */}
                {(isUploading || isAnalyzing) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {isUploading ? "Uploading..." : "Analyzing with AI..."}
                      </span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                {/* Action button */}
                <Button
                  className="w-full gradient-primary border-0"
                  onClick={uploadAndAnalyze}
                  disabled={isUploading || isAnalyzing}
                >
                  {isUploading || isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isUploading ? "Uploading..." : "Analyzing..."}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload & Analyze
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {resumeData && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Analysis Results
              </CardTitle>
              <CardDescription>
                Here's what we found in your resume
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div>
                <h4 className="font-medium mb-2">Professional Summary</h4>
                <p className="text-muted-foreground">{resumeData.summary}</p>
              </div>

              {/* Stats */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="text-2xl font-bold">{resumeData.experience_years} years</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Education</p>
                  <p className="text-lg font-medium">{resumeData.education}</p>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="font-medium mb-3">Extracted Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skill Insights Visualization */}
        {resumeData && resumeData.skills.length > 0 && (
          <div className="mb-8">
            <SkillInsights skills={resumeData.skills} />
          </div>
        )}

        {/* Features Preview */}
        {!resumeData && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  What We Analyze
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Skills extraction and categorization</li>
                  <li>• Work experience analysis</li>
                  <li>• Education verification</li>
                  <li>• Professional summary generation</li>
                  <li>• Job matching readiness</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-accent" />
                  What You'll Get
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Comprehensive skills list</li>
                  <li>• Experience summary</li>
                  <li>• AI-powered insights</li>
                  <li>• Job match scoring</li>
                  <li>• Profile enhancement tips</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
