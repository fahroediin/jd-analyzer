export interface UploadedFile {
  id: number;
  filename: string;
  content: string;
  extractedSkills?: string[];
  createdAt: string;
}

export interface JobDescription extends UploadedFile {}

export interface CV extends UploadedFile {}

export interface SkillMatch {
  skill: string;
  foundInCV: boolean;
}

export interface AnalysisResult {
  id: number;
  jobDescriptionId: number;
  cvId: number;
  matchScore: number;
  skillMatches: SkillMatch[];
  skillGaps: string[];
  createdAt: string;
  cv?: CV;
}

export interface AnalysisRequest {
  jobDescriptionId: number;
  cvIds: number[];
}

export interface AnalysisResponse {
  jobDescription: JobDescription;
  results: AnalysisResult[];
  sortedCandidates: AnalysisResult[];
}