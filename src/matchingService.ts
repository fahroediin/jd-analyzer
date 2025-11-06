import type { SkillMatch, AnalysisResult } from "./types";

export class MatchingService {
  static calculateMatch(
    jobSkills: string[],
    cvSkills: string[],
    jobDescriptionId: number,
    cvId: number
  ): AnalysisResult {
    const skillMatches: SkillMatch[] = [];
    const skillGaps: string[] = [];
    let matchScore = 0;

    // Normalize skills to lowercase for comparison
    const normalizedJobSkills = jobSkills.map(skill => skill.toLowerCase());
    const normalizedCVSkills = cvSkills.map(skill => skill.toLowerCase());

    // Find matching and missing skills
    jobSkills.forEach((skill, index) => {
      const normalizedSkill = normalizedJobSkills[index];
      const foundIndex = normalizedCVSkills.findIndex(cvSkill =>
        cvSkill === normalizedSkill
      );

      if (foundIndex !== -1) {
        skillMatches.push({
          skill,
          foundInCV: true
        });
        matchScore++;
      } else {
        skillMatches.push({
          skill,
          foundInCV: false
        });
        skillGaps.push(skill);
      }
    });

    // Bonus points for additional relevant skills in CV
    const additionalRelevantSkills = cvSkills.filter(cvSkill =>
      !normalizedJobSkills.includes(cvSkill.toLowerCase()) &&
      this.isRelevantSkill(cvSkill, jobSkills)
    );

    matchScore += additionalRelevantSkills.length * 0.5;

    // Calculate percentage score based on direct matches only (no bonus)
    const directMatches = skillMatches.filter(match => match.foundInCV).length;
    const finalScore = jobSkills.length > 0
      ? Math.round((directMatches / jobSkills.length) * 100)
      : 0;

    return {
      id: 0, // Will be set by database
      jobDescriptionId,
      cvId,
      matchScore: finalScore,
      skillMatches,
      skillGaps,
      createdAt: new Date().toISOString()
    };
  }

  private static isRelevantSkill(skill: string, jobSkills: string[]): boolean {
    // Check if the skill is in the same domain as required skills
    const domains = {
      programming: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'php', 'ruby'],
      web: ['html', 'css', 'react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask'],
      database: ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle'],
      cloud: ['aws', 'azure', 'google cloud', 'gcp', 'docker', 'kubernetes'],
      devops: ['git', 'ci/cd', 'jenkins', 'gitlab', 'github', 'testing'],
      design: ['ui', 'ux', 'figma', 'sketch', 'photoshop', 'adobe'],
      management: ['project', 'agile', 'scrum', 'leadership', 'communication'],
      data: ['data', 'analytics', 'machine learning', 'ai', 'statistics']
    };

    const skillLower = skill.toLowerCase();

    // Check if skill belongs to any domain that appears in job skills
    for (const [domain, domainSkills] of Object.entries(domains)) {
      const skillInDomain = domainSkills.some(domainSkill => skillLower.includes(domainSkill));
      const jobHasDomain = jobSkills.some(jobSkill =>
        domainSkills.some(domainSkill => jobSkill.toLowerCase().includes(domainSkill))
      );

      if (skillInDomain && jobHasDomain) {
        return true;
      }
    }

    return false;
  }

  static sortCandidatesByScore(results: AnalysisResult[]): AnalysisResult[] {
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  static getTopCandidates(results: AnalysisResult[], count: number = 5): AnalysisResult[] {
    return this.sortCandidatesByScore(results).slice(0, count);
  }
}