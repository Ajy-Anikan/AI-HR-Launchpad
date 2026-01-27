import { FileText, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ResumeAnalyzer() {
  return (
    <div className="container py-8">
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
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload your resume</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop or click to upload. Supports PDF, DOCX, and TXT.
              </p>
              <Button className="gradient-primary border-0">
                Select File
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
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
                <li>• Keyword optimization for ATS</li>
                <li>• Content structure and formatting</li>
                <li>• Skills alignment with job roles</li>
                <li>• Action verbs and impact statements</li>
                <li>• Grammar and spelling checks</li>
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
                <li>• Overall score out of 100</li>
                <li>• Section-by-section feedback</li>
                <li>• Improvement suggestions</li>
                <li>• Industry-specific tips</li>
                <li>• Optimized resume template</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
