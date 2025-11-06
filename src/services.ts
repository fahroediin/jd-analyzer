import database from "./database";
import type { JobDescription, CV, AnalysisResult } from "./types";
import { SkillExtractor } from "./skillExtractor";
import { MatchingService } from "./matchingService";

export class JobDescriptionService {
  static async create(filename: string, content: string): Promise<JobDescription> {
    const extractedSkills = SkillExtractor.extractSkills(content);

    const query = database.query(`
      INSERT INTO job_descriptions (filename, content, extracted_skills)
      VALUES (?, ?, ?)
      RETURNING id, filename, content, extracted_skills, created_at
    `);

    const result = query.get(filename, content, JSON.stringify(extractedSkills)) as any;

    return {
      id: result.id,
      filename: result.filename,
      content: result.content,
      extractedSkills: JSON.parse(result.extracted_skills),
      createdAt: result.created_at
    };
  }

  static async findById(id: number): Promise<JobDescription | null> {
    const query = database.query(`
      SELECT id, filename, content, extracted_skills, created_at
      FROM job_descriptions
      WHERE id = ?
    `);

    const result = query.get(id) as any;
    if (!result) return null;

    return {
      id: result.id,
      filename: result.filename,
      content: result.content,
      extractedSkills: JSON.parse(result.extracted_skills),
      createdAt: result.created_at
    };
  }

  static async getAll(): Promise<JobDescription[]> {
    const query = database.query(`
      SELECT id, filename, content, extracted_skills, created_at
      FROM job_descriptions
      ORDER BY created_at DESC
    `);

    const results = query.all() as any[];
    return results.map(result => ({
      id: result.id,
      filename: result.filename,
      content: result.content,
      extractedSkills: JSON.parse(result.extracted_skills),
      createdAt: result.created_at
    }));
  }

  static async delete(id: number): Promise<boolean> {
    const query = database.query("DELETE FROM job_descriptions WHERE id = ?");
    const result = query.run(id);
    return result.changes > 0;
  }
}

export class CVService {
  static async create(filename: string, content: string): Promise<CV> {
    const extractedSkills = SkillExtractor.extractSkills(content);

    const query = database.query(`
      INSERT INTO cvs (filename, content, extracted_skills)
      VALUES (?, ?, ?)
      RETURNING id, filename, content, extracted_skills, created_at
    `);

    const result = query.get(filename, content, JSON.stringify(extractedSkills)) as any;

    return {
      id: result.id,
      filename: result.filename,
      content: result.content,
      extractedSkills: JSON.parse(result.extracted_skills),
      createdAt: result.created_at
    };
  }

  static async findById(id: number): Promise<CV | null> {
    const query = database.query(`
      SELECT id, filename, content, extracted_skills, created_at
      FROM cvs
      WHERE id = ?
    `);

    const result = query.get(id) as any;
    if (!result) return null;

    return {
      id: result.id,
      filename: result.filename,
      content: result.content,
      extractedSkills: JSON.parse(result.extracted_skills),
      createdAt: result.created_at
    };
  }

  static async getAll(): Promise<CV[]> {
    const query = database.query(`
      SELECT id, filename, content, extracted_skills, created_at
      FROM cvs
      ORDER BY created_at DESC
    `);

    const results = query.all() as any[];
    return results.map(result => ({
      id: result.id,
      filename: result.filename,
      content: result.content,
      extractedSkills: JSON.parse(result.extracted_skills),
      createdAt: result.created_at
    }));
  }

  static async findByIds(ids: number[]): Promise<CV[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(',');
    const query = database.query(`
      SELECT id, filename, content, extracted_skills, created_at
      FROM cvs
      WHERE id IN (${placeholders})
      ORDER BY created_at DESC
    `);

    const results = query.all(...ids) as any[];
    return results.map(result => ({
      id: result.id,
      filename: result.filename,
      content: result.content,
      extractedSkills: JSON.parse(result.extracted_skills),
      createdAt: result.created_at
    }));
  }

  static async delete(id: number): Promise<boolean> {
    const query = database.query("DELETE FROM cvs WHERE id = ?");
    const result = query.run(id);
    return result.changes > 0;
  }
}

export class AnalysisService {
  static async analyze(jobDescriptionId: number, cvIds: number[]): Promise<AnalysisResult[]> {
    const jobDescription = await JobDescriptionService.findById(jobDescriptionId);
    if (!jobDescription) {
      throw new Error("Job description not found");
    }

    const cvs = await CVService.findByIds(cvIds);
    if (cvs.length === 0) {
      throw new Error("No CVs found");
    }

    const results: AnalysisResult[] = [];

    for (const cv of cvs) {
      const analysis = MatchingService.calculateMatch(
        jobDescription.extractedSkills || [],
        cv.extractedSkills || [],
        jobDescriptionId,
        cv.id
      );

      // Save to database
      const query = database.query(`
        INSERT INTO analyses (job_description_id, cv_id, match_score, skill_matches, skill_gaps)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id, created_at
      `);

      const dbResult = query.get(
        jobDescriptionId,
        cv.id,
        analysis.matchScore,
        JSON.stringify(analysis.skillMatches),
        JSON.stringify(analysis.skillGaps)
      ) as any;

      analysis.id = dbResult.id;
      analysis.createdAt = dbResult.created_at;
      analysis.cv = cv;

      results.push(analysis);
    }

    return results;
  }

  static async getAnalysisResults(jobDescriptionId: number): Promise<AnalysisResult[]> {
    const query = database.query(`
      SELECT a.id, a.job_description_id, a.cv_id, a.match_score, a.skill_matches, a.skill_gaps, a.created_at,
             cv.filename as cv_filename, cv.content as cv_content, cv.extracted_skills as cv_skills, cv.created_at as cv_created_at
      FROM analyses a
      JOIN cvs cv ON a.cv_id = cv.id
      WHERE a.job_description_id = ?
      ORDER BY a.match_score DESC
    `);

    const results = query.all(jobDescriptionId) as any[];

    return results.map(result => ({
      id: result.id,
      jobDescriptionId: result.job_description_id,
      cvId: result.cv_id,
      matchScore: result.match_score,
      skillMatches: JSON.parse(result.skill_matches),
      skillGaps: JSON.parse(result.skill_gaps),
      createdAt: result.created_at,
      cv: {
        id: result.cv_id,
        filename: result.cv_filename,
        content: result.cv_content,
        extractedSkills: JSON.parse(result.cv_skills),
        createdAt: result.cv_created_at
      }
    }));
  }

  static async deleteAnalysis(jobDescriptionId: number): Promise<boolean> {
    const query = database.query("DELETE FROM analyses WHERE job_description_id = ?");
    const result = query.run(jobDescriptionId);
    return result.changes > 0;
  }
}