import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Upload, FileText, Users, BarChart3, CheckCircle, XCircle, AlertCircle, Sparkles, Brain, Target, Eye, Trash2, FileCheck } from "lucide-react";
import "./index.css";
import "./styles/background.css";

interface JobDescription {
  id: number;
  filename: string;
  content: string;
  extractedSkills?: string[];
  createdAt: string;
}

interface CV {
  id: number;
  filename: string;
  content: string;
  extractedSkills?: string[];
  createdAt: string;
}

interface AnalysisResult {
  id: number;
  jobDescriptionId: number;
  cvId: number;
  matchScore: number;
  skillMatches: Array<{ skill: string; foundInCV: boolean }>;
  skillGaps: string[];
  createdAt: string;
  cv?: CV;
}

export function App() {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [selectedJD, setSelectedJD] = useState<JobDescription | null>(null);
  const [selectedCVs, setSelectedCVs] = useState<number[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({ jd: false, cv: false });
  const [viewingJD, setViewingJD] = useState<JobDescription | null>(null);
  const [viewingCV, setViewingCV] = useState<CV | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const fetchJobDescriptions = async () => {
    try {
      const response = await fetch("/api/job-descriptions");
      const data = await response.json();
      setJobDescriptions(data);
    } catch (error) {
      console.error("Error fetching job descriptions:", error);
    }
  };

  const fetchCVs = async () => {
    try {
      const response = await fetch("/api/cvs");
      const data = await response.json();
      setCvs(data);
    } catch (error) {
      console.error("Error fetching CVs:", error);
    }
  };

  const uploadJobDescription = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check for duplicate content
    const isDuplicate = await isDuplicateContent(file, jobDescriptions);
    if (isDuplicate) {
      alert("This job description already exists in the database. Duplicate uploads are not allowed to prevent redundancy.");
      event.target.value = "";
      return;
    }

    setUploading({ ...uploading, jd: true });
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/job-descriptions", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        await fetchJobDescriptions();
        event.target.value = "";
      } else {
        const error = await response.json();
        alert(error.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading job description:", error);
      alert("Upload failed");
    } finally {
      setUploading({ ...uploading, jd: false });
    }
  };

  const uploadCVs = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check for duplicate content
    const duplicateFiles: string[] = [];
    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      const isDuplicate = await isDuplicateContent(file, cvs);
      if (isDuplicate) {
        duplicateFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    }

    if (duplicateFiles.length > 0) {
      alert(`The following CVs already exist in the database and were not uploaded:\n${duplicateFiles.join(", ")}\n\nDuplicate uploads are not allowed to prevent redundancy.`);
    }

    if (validFiles.length === 0) {
      event.target.value = "";
      return;
    }

    setUploading({ ...uploading, cv: true });
    const formData = new FormData();
    validFiles.forEach(file => formData.append("files", file));

    try {
      const response = await fetch("/api/cvs", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        await fetchCVs();
        event.target.value = "";
      } else {
        const error = await response.json();
        alert(error.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading CVs:", error);
      alert("Upload failed");
    } finally {
      setUploading({ ...uploading, cv: false });
    }
  };

  const analyzeCandidates = async () => {
    if (!selectedJD || selectedCVs.length === 0) {
      alert("Please select a job description and at least one CV");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescriptionId: selectedJD.id,
          cvIds: selectedCVs,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResults(data.sortedCandidates);
      } else {
        const error = await response.json();
        alert(error.error || "Analysis failed");
      }
    } catch (error) {
      console.error("Error analyzing candidates:", error);
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to create content hash for duplicate detection
  const createContentHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    // Simple hash function for content comparison
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  };

  // Check for duplicate content
  const isDuplicateContent = async (file: File, existingItems: Array<{ content: string }>): Promise<boolean> => {
    const fileHash = await createContentHash(file);
    for (const item of existingItems) {
      // Create a File-like object from the content
      const blob = new Blob([item.content]);
      const tempFile = new File([blob], "temp.txt", { type: "text/plain" });
      const itemHash = await createContentHash(tempFile);
      if (fileHash === itemHash) {
        return true;
      }
    }
    return false;
  };

  // Delete functions
  const deleteJobDescription = async (id: number) => {
    try {
      const response = await fetch(`/api/job-descriptions/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchJobDescriptions();
        if (selectedJD?.id === id) {
          setSelectedJD(null);
        }
      }
    } catch (error) {
      console.error("Error deleting job description:", error);
    }
  };

  const deleteCV = async (id: number) => {
    try {
      const response = await fetch(`/api/cvs/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchCVs();
        setSelectedCVs(prev => prev.filter(cvId => cvId !== id));
      }
    } catch (error) {
      console.error("Error deleting CV:", error);
    }
  };

  const toggleCVSelection = (cvId: number) => {
    setSelectedCVs(prev =>
      prev.includes(cvId)
        ? prev.filter(id => id !== cvId)
        : [...prev, cvId]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  useEffect(() => {
    fetchJobDescriptions();
    fetchCVs();

    // Auto-create sample data for demonstration
    createSampleData();
  }, []);

  // Create sample data for demonstration
  const createSampleData = async () => {
    try {
      // Create sample job description if none exists
      const jdResponse = await fetch('/api/job-descriptions');
      const existingJDs = await jdResponse.json();

      if (existingJDs.length === 0) {
        // Create sample JD
        const jdFormData = new FormData();
        const jdBlob = new Blob([`
Senior Full Stack Developer

We are looking for an experienced Full Stack Developer to join our dynamic team.

Requirements:
- 5+ years of experience in web development
- Strong proficiency in JavaScript, TypeScript, React
- Experience with Node.js, Express, and REST APIs
- Knowledge of cloud platforms (AWS, Azure)
- Familiarity with databases (PostgreSQL, MongoDB)
- Understanding of DevOps practices (Docker, CI/CD)
- Excellent problem-solving skills
- Team player with good communication abilities

Responsibilities:
- Develop and maintain web applications
- Work with cross-functional teams
- Participate in code reviews and best practices
- Mentor junior developers
- Contribute to technical architecture decisions

Skills: JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, AWS, Docker, Git, Agile, Leadership
        `], { type: 'text/plain' });
        jdFormData.append('file', new File([jdBlob], 'sample-jd.txt'));

        await fetch('/api/job-descriptions', {
          method: 'POST',
          body: jdFormData
        });
      }

      // Create sample CVs if none exist
      const cvResponse = await fetch('/api/cvs');
      const existingCVs = await cvResponse.json();

      if (existingCVs.length === 0) {
        // Create sample CV 1
        const cv1Blob = new Blob([`
John Doe - Senior Software Engineer

Experience:
- Senior Software Engineer at TechCorp (2020-Present)
- Full Stack Developer at StartupXYZ (2018-2020)
- Junior Developer at WebSolutions (2016-2018)

Skills:
- Programming: JavaScript, TypeScript, Python, Java
- Frontend: React, Vue.js, HTML, CSS, Tailwind
- Backend: Node.js, Express, Django, Flask
- Database: PostgreSQL, MongoDB, MySQL
- Cloud: AWS, Azure, Google Cloud
- Tools: Git, Docker, Jenkins, JIRA
- Methodologies: Agile, Scrum, TDD

Education:
- BS Computer Science, State University (2016)

Projects:
- E-commerce platform using React and Node.js
- Real-time chat application with WebSocket
- RESTful API design for mobile applications
        `], { type: 'text/plain' });
        const cv1FormData = new FormData();
        cv1FormData.append('files', new File([cv1Blob], 'john-doe-cv.txt'));

        await fetch('/api/cvs', {
          method: 'POST',
          body: cv1FormData
        });

        // Create sample CV 2
        const cv2Blob = new Blob([`
Jane Smith - Full Stack Developer

Experience:
- Full Stack Developer at DigitalAgency (2019-Present)
- Frontend Developer at DesignStudio (2017-2019)
- Web Developer Intern at TechStart (2016-2017)

Skills:
- Programming: JavaScript, TypeScript, PHP, Ruby
- Frontend: React, Angular, HTML, CSS, SASS
- Backend: Node.js, Express, Laravel, Rails
- Database: MySQL, PostgreSQL, Redis
- Cloud: AWS, Heroku, Vercel
- Tools: Git, SVN, Webpack, npm
- Methodologies: Scrum, Kanban, Waterfall

Education:
- BA Information Systems, Tech University (2017)

Projects:
- Content management system with Laravel
- Progressive web application for retail
- API integration for payment gateways
        `], { type: 'text/plain' });
        const cv2FormData = new FormData();
        cv2FormData.append('files', new File([cv2Blob], 'jane-smith-cv.txt'));

        await fetch('/api/cvs', {
          method: 'POST',
          body: cv2FormData
        });

        // Create sample CV 3
        const cv3Blob = new Blob([`
Mike Johnson - Backend Developer

Experience:
- Backend Developer at DataCorp (2021-Present)
- Software Engineer at CloudTech (2019-2021)
- Junior Developer at StartHub (2017-2019)

Skills:
- Programming: Python, Java, Go, Rust
- Backend: Django, Flask, Spring Boot, Gin
- Database: PostgreSQL, MongoDB, Cassandra
- Cloud: AWS, GCP, Azure
- Tools: Git, Docker, Kubernetes, Terraform
- Methodologies: Agile, DevOps, Microservices

Education:
- MS Software Engineering, Tech Institute (2017)

Projects:
- Microservices architecture for e-commerce
- Data processing pipeline with Python
- Cloud infrastructure automation
        `], { type: 'text/plain' });
        const cv3FormData = new FormData();
        cv3FormData.append('files', new File([cv3Blob], 'mike-johnson-cv.txt'));

        await fetch('/api/cvs', {
          method: 'POST',
          body: cv3FormData
        });

        // Refresh data after creating samples
        setTimeout(() => {
          fetchJobDescriptions();
          fetchCVs();
        }, 1000);
      }
    } catch (error) {
      console.log('Sample data creation failed:', error);
    }
  };

  return (
    <>
      {/* Floating background elements */}
      <div className="floating-elements">
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
      </div>

      <div className="main-container min-h-screen p-4 md:p-8">
        {/* Header */}
        <div className="text-center mb-8 text-white">
          <div className="flex justify-center items-center gap-4 mb-4">
            <Brain className="h-12 w-12 text-white animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
              JD Analyzer
            </h1>
            <Target className="h-12 w-12 text-white animate-pulse" />
          </div>
          <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto">
            AI-Powered Job Description & CV Matching System
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge className="bg-purple-600 text-white px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Analysis
            </Badge>
            <Badge className="bg-pink-600 text-white px-4 py-2">
              <Target className="h-4 w-4 mr-2" />
              Smart Matching
            </Badge>
            <Badge className="bg-indigo-600 text-white px-4 py-2">
              <BarChart3 className="h-4 w-4 mr-2" />
              Ranked Results
            </Badge>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Job Description Upload */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Job Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="upload-area border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-purple-500 mb-3" />
                <label className="cursor-pointer">
                  <span className="text-sm text-purple-700 font-medium">
                    {uploading.jd ? "Uploading..." : "Click to upload job description (PDF/DOCX/TXT)"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    onChange={uploadJobDescription}
                    disabled={uploading.jd}
                  />
                </label>
              </div>

              {jobDescriptions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Select Job Description:
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {jobDescriptions.map(jd => (
                      <div
                        key={jd.id}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                          selectedJD?.id === jd.id
                            ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-2 border-blue-400/50 shadow-lg shadow-blue-500/20 backdrop-blur-sm"
                            : "bg-white/10 border-2 border-white/20 hover:bg-white/15 hover:border-white/30 backdrop-blur-sm"
                        }`}
                        onClick={() => setSelectedJD(jd)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full transition-colors ${
                              selectedJD?.id === jd.id
                                ? "bg-blue-400 animate-pulse"
                                : "bg-purple-400"
                            }`} />
                            <span className={`font-medium ${
                              selectedJD?.id === jd.id
                                ? "text-blue-800"
                                : "text-purple-800"
                            }`}>
                              {jd.filename}
                            </span>
                          </div>
                          {selectedJD?.id === jd.id && (
                            <CheckCircle className="h-5 w-5 text-blue-600 animate-bounce" />
                          )}
                        </div>
                        <div className={`flex items-center gap-2 mt-2 ${
                          selectedJD?.id === jd.id
                            ? "text-blue-700"
                            : "text-purple-700"
                        }`}>
                          <Badge className={`text-xs ${
                            selectedJD?.id === jd.id
                              ? "bg-blue-500/30 text-blue-800 border-blue-400/50"
                              : "bg-purple-500/30 text-purple-800 border-purple-400/50"
                          }`}>
                            {jd.extractedSkills?.length || 0} skills extracted
                          </Badge>
                          {jd.extractedSkills?.length === 0 && (
                            <span className="text-xs text-amber-700 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              PDF extraction failed
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6 px-2 bg-white/20 border-white/30 hover:bg-white/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingJD(jd);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6 px-2 bg-red-500/20 border-red-400/30 hover:bg-red-500/30 text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteJobDescription(jd.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CV Upload */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Candidate CVs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="upload-area border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-purple-500 mb-3" />
                <label className="cursor-pointer">
                  <span className="text-sm text-purple-700 font-medium">
                    {uploading.cv ? "Uploading..." : "Click to upload CVs (PDF/DOCX/TXT, multiple allowed)"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    multiple
                    onChange={uploadCVs}
                    disabled={uploading.cv}
                  />
                </label>
              </div>

              {cvs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Select CVs to Analyze:
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {cvs.map(cv => (
                      <div
                        key={cv.id}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                          selectedCVs.includes(cv.id)
                            ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 shadow-lg shadow-green-500/20 backdrop-blur-sm"
                            : "bg-white/10 border-2 border-white/20 hover:bg-white/15 hover:border-white/30 backdrop-blur-sm"
                        }`}
                        onClick={() => toggleCVSelection(cv.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full transition-colors ${
                              selectedCVs.includes(cv.id)
                                ? "bg-green-400 animate-pulse"
                                : "bg-purple-400"
                            }`} />
                            <span className={`font-medium ${
                              selectedCVs.includes(cv.id)
                                ? "text-green-800"
                                : "text-purple-800"
                            }`}>
                              {cv.filename}
                            </span>
                          </div>
                          {selectedCVs.includes(cv.id) && (
                            <CheckCircle className="h-5 w-5 text-green-600 animate-bounce" />
                          )}
                        </div>
                        <div className={`text-sm mt-2 flex items-center gap-2 ${
                          selectedCVs.includes(cv.id)
                            ? "text-green-700"
                            : "text-purple-700"
                        }`}>
                          <Badge className={`text-xs ${
                            selectedCVs.includes(cv.id)
                              ? "bg-green-500/30 text-green-800 border-green-400/50"
                              : "bg-purple-500/30 text-purple-800 border-purple-400/50"
                          }`}>
                            {cv.extractedSkills?.length || 0} skills extracted
                          </Badge>
                          {cv.extractedSkills?.length === 0 && (
                            <span className="text-xs text-amber-700 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              PDF extraction failed
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6 px-2 bg-white/20 border-white/30 hover:bg-white/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingCV(cv);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6 px-2 bg-red-500/20 border-red-400/30 hover:bg-red-500/30 text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCV(cv.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyze Button */}
      <div className="text-center mb-8">
        <Button
          onClick={analyzeCandidates}
          disabled={!selectedJD || selectedCVs.length === 0 || loading}
          size="lg"
          className="px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? "Analyzing..." : "Analyze Candidates"}
          <BarChart3 className="ml-2 h-5 w-5" />
        </Button>

        {/* Instructions */}
        <div className="mt-4 text-white text-center max-w-2xl mx-auto">
          {!selectedJD && !cvs.length && (
            <p className="text-purple-200 bg-purple-800/30 backdrop-blur-sm rounded-lg p-4 border border-purple-600/30">
              <AlertCircle className="inline-block h-5 w-5 mr-2 mb-1" />
              <strong>Getting Started:</strong> Upload a job description and at least one CV to enable analysis
            </p>
          )}
          {selectedJD && !selectedCVs.length && (
            <p className="text-green-200 bg-green-800/30 backdrop-blur-sm rounded-lg p-4 border border-green-600/30">
              <CheckCircle className="inline-block h-5 w-5 mr-2 mb-1" />
              <strong>Job Description Selected:</strong> Now upload and select one or more CVs to analyze
            </p>
          )}
          {!selectedJD && selectedCVs.length > 0 && (
            <p className="text-blue-200 bg-blue-800/30 backdrop-blur-sm rounded-lg p-4 border border-blue-600/30">
              <FileText className="inline-block h-5 w-5 mr-2 mb-1" />
              <strong>CVs Ready:</strong> Select a job description to start analyzing candidates
            </p>
          )}
          {selectedJD && selectedCVs.length > 0 && !loading && (
            <p className="text-yellow-200 bg-yellow-800/30 backdrop-blur-sm rounded-lg p-4 border border-yellow-600/30">
              <Target className="inline-block h-5 w-5 mr-2 mb-1" />
              <strong>Ready to Analyze:</strong> {selectedCVs.length} CV(s) selected for "{selectedJD.filename}"
            </p>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analysis Results - Ranked by Match Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisResults.map((result, index) => (
                <div key={result.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-gray-500">#{index + 1}</div>
                      <div>
                        <h3 className="font-semibold text-lg">{result.cv?.filename}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getScoreColor(result.matchScore)}>
                            {result.matchScore}% Match
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {result.skillMatches.filter(m => m.foundInCV).length}/{result.skillMatches.length} skills matched
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {result.skillMatches.length > 0 && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Skill Matching:</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.skillMatches.map((match, i) => (
                            <div
                              key={i}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                match.foundInCV
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {match.foundInCV ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              {match.skill}
                            </div>
                          ))}
                        </div>
                      </div>

                      {result.skillGaps.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-red-700 mb-2 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            Missing Skills:
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {result.skillGaps.map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* JD Viewer Modal */}
      {viewingJD && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20">
            <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-bold text-blue-800">{viewingJD.filename}</h3>
                    <p className="text-sm text-blue-600">
                      Uploaded: {new Date(viewingJD.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-red-500/20 border-red-400/30 hover:bg-red-500/30 text-red-700"
                  onClick={() => setViewingJD(null)}
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Extracted Skills ({viewingJD.extractedSkills?.length || 0})
                </h4>
                {viewingJD.extractedSkills && viewingJD.extractedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {viewingJD.extractedSkills.map((skill, index) => (
                      <Badge key={index} className="bg-blue-500/20 text-blue-800 border-blue-400/50">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-amber-700 bg-amber-100/50 p-3 rounded-lg border border-amber-200">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    No skills extracted - likely due to PDF parsing failure
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Document Content</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 max-h-96 overflow-y-auto">
                    {viewingJD.content}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CV Viewer Modal */}
      {viewingCV && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="text-xl font-bold text-green-800">{viewingCV.filename}</h3>
                    <p className="text-sm text-green-600">
                      Uploaded: {new Date(viewingCV.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-red-500/20 border-red-400/30 hover:bg-red-500/30 text-red-700"
                  onClick={() => setViewingCV(null)}
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Extracted Skills ({viewingCV.extractedSkills?.length || 0})
                </h4>
                {viewingCV.extractedSkills && viewingCV.extractedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {viewingCV.extractedSkills.map((skill, index) => (
                      <Badge key={index} className="bg-green-500/20 text-green-800 border-green-400/50">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-amber-700 bg-amber-100/50 p-3 rounded-lg border border-amber-200">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    No skills extracted - likely due to PDF parsing failure
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Document Content</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 max-h-96 overflow-y-auto">
                    {viewingCV.content}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

export default App;
