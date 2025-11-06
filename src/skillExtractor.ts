export class SkillExtractor {
  private static readonly COMMON_SKILLS = [
    'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'C++', 'C#',
    'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS',
    'Azure', 'Google Cloud', 'Git', 'CI/CD', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'Microservices',
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'Data Analysis', 'Statistics',
    'Project Management', 'Leadership', 'Communication', 'Problem Solving', 'Team Work', 'Critical Thinking',
    'DevOps', 'Linux', 'Windows', 'MacOS', 'Bash', 'PowerShell', 'Network', 'Security', 'Testing',
    'Unit Testing', 'Integration Testing', 'E2E Testing', 'Jest', 'Cypress', 'Selenium', 'Webpack', 'Vite',
    'Express.js', 'FastAPI', 'Django', 'Spring Boot', 'Laravel', 'Ruby on Rails', 'PHP', 'Go', 'Rust',
    'Swift', 'Kotlin', 'Flutter', 'React Native', 'UI/UX', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop'
  ];

  private static readonly SKILL_PATTERNS = [
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Go|Rust|Swift|Kotlin|PHP|Ruby|Scala|R|MATLAB)\b/gi,
    /\b(React|Vue|Angular|Svelte|Next\.js|Nuxt\.js|Express|FastAPI|Django|Flask|Spring|Laravel|Rails)\b/gi,
    /\b(HTML|CSS|SQL|NoSQL|GraphQL|REST|SOAP|JSON|XML|YAML|Markdown)\b/gi,
    /\b(MySQL|PostgreSQL|MongoDB|Redis|Cassandra|Elasticsearch|Oracle|SQL Server|SQLite)\b/gi,
    /\b(AWS|Azure|GCP|Google Cloud|AWS Lambda|EC2|S3|Azure Functions|Google Functions)\b/gi,
    /\b(Docker|Kubernetes|K8s|Jenkins|GitLab CI|GitHub Actions|Travis CI|CircleCI)\b/gi,
    /\b(Git|SVN|Mercurial|Bitbucket|GitHub|GitLab|SourceTree)\b/gi,
    /\b(Agile|Scrum|Kanban|Waterfall|Lean|SAFe|XP|TDD|BDD)\b/gi,
    /\b(Machine Learning|Deep Learning|AI|Data Science|Analytics|NLP|Computer Vision)\b/gi,
    /\b(TensorFlow|PyTorch|Keras|Scikit-learn|Pandas|NumPy|Jupyter|RStudio)\b/gi,
    /\b(Project Management|Product Management|Team Leadership|Stakeholder Management)\b/gi,
    /\b(Communication|Presentation|Public Speaking|Negotiation|Facilitation)\b/gi,
    /\b(Problem Solving|Critical Thinking|Analytical Skills|Research|Decision Making)\b/gi,
    /\b(DevOps|Site Reliability|Microservices|Serverless|Cloud Native|Infrastructure)\b/gi,
    /\b(Linux|Windows|MacOS|Unix|Bash|PowerShell|Command Line|Terminal)\b/gi,
    /\b(Network|TCP\/IP|HTTP|HTTPS|DNS|Firewall|VPN|Load Balancer)\b/gi,
    /\b(Security|Cryptography|Penetration Testing|Vulnerability Assessment|Compliance)\b/gi,
    /\b(Testing|QA|Quality Assurance|Unit Testing|Integration Testing|E2E Testing|Automation)\b/gi,
    /\b(Jest|Mocha|Chai|Cypress|Selenium|Playwright|Testing Library)\b/gi,
    /\b(Webpack|Vite|Parcel|Rollup|Babel|ESLint|Prettier|npm|yarn|pnpm)\b/gi,
    /\b(UI|UX|User Interface|User Experience|Design|Figma|Sketch|Adobe XD|Photoshop)\b/gi,
    /\b(Bootstrap|Tailwind|Material UI|Ant Design|Chakra UI|Bulma|Foundation)\b/gi,
    /\b(Salesforce|HubSpot|Marketo|Mailchimp|Google Analytics|Adobe Analytics)\b/gi,
    /\b(SAP|Oracle|NetSuite|QuickBooks|Xero|FreshBooks|Wave)\b/gi
  ];

  static extractSkills(text: string): string[] {
    const skills = new Set<string>();
    const lowerText = text.toLowerCase();

    // Extract skills using patterns
    this.SKILL_PATTERNS.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Normalize skill name
          const normalizedSkill = this.normalizeSkillName(match);
          if (this.isValidSkill(normalizedSkill)) {
            skills.add(normalizedSkill);
          }
        });
      }
    });

    // Look for common skills
    this.COMMON_SKILLS.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        skills.add(skill);
      }
    });

    // Look for skills in parentheses and bullet points
    const parenthesesSkills = text.match(/\(([^)]+)\)/g);
    if (parenthesesSkills) {
      parenthesesSkills.forEach(group => {
        const cleanGroup = group.replace(/[()]/g, '');
        const potentialSkills = cleanGroup.split(/[,;&\/]/);
        potentialSkills.forEach(skill => {
          const trimmedSkill = skill.trim();
          if (this.isValidSkill(trimmedSkill) && trimmedSkill.length > 1) {
            skills.add(trimmedSkill);
          }
        });
      });
    }

    // Look for skills after "experienced in", "skilled in", "proficient in", etc.
    const experiencePatterns = [
      /(?:experienced|skilled|proficient|expert|knowledge|familiar)\s+(?:in|with|of)\s+([^.,;\n]+)/gi,
      /(?:experience|skills?|competencies|abilities?)(?:\s*:\s*|\s+include?s?\s+)([^.,;\n]+)/gi
    ];

    experiencePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.replace(/^(?:experienced|skilled|proficient|expert|knowledge|familiar|experience|skills?|competencies|abilities?)(?:\s*(?:in|with|of|:)|\s+include?s?)\s+/i, '');
          const potentialSkills = cleanMatch.split(/[,;&\/]/);
          potentialSkills.forEach(skill => {
            const trimmedSkill = skill.trim();
            if (this.isValidSkill(trimmedSkill) && trimmedSkill.length > 1) {
              skills.add(trimmedSkill);
            }
          });
        });
      }
    });

    return Array.from(skills).sort();
  }

  private static normalizeSkillName(skill: string): string {
    // Normalize common variations
    const normalizations: Record<string, string> = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'node': 'Node.js',
      'reactjs': 'React',
      'react.js': 'React',
      'vuejs': 'Vue.js',
      'angularjs': 'Angular',
      'ml': 'Machine Learning',
      'ai': 'AI',
      'aws': 'AWS',
      'gcp': 'Google Cloud',
      'ci/cd': 'CI/CD',
      'cicd': 'CI/CD',
      'ui/ux': 'UI/UX',
      'ux': 'UX',
      'ui': 'UI'
    };

    const lowerSkill = skill.toLowerCase();
    return normalizations[lowerSkill] || skill;
  }

  private static isValidSkill(skill: string): boolean {
    // Filter out common non-skill words
    const excludedWords = [
      'and', 'or', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'as', 'is', 'are', 'was',
      'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'must', 'shall', 'experience', 'years', 'year', 'months', 'month',
      'including', 'such', 'etc', 'various', 'multiple', 'different', 'several', 'many', 'various',
      'strong', 'excellent', 'good', 'solid', 'deep', 'extensive', 'hands-on', 'practical'
    ];

    const lowerSkill = skill.toLowerCase().trim();

    // Must be at least 2 characters
    if (skill.length < 2) return false;

    // Must not be in excluded words
    if (excludedWords.includes(lowerSkill)) return false;

    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(skill)) return false;

    // Must not be just numbers
    if (/^\d+$/.test(skill)) return false;

    return true;
  }
}