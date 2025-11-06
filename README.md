# JD Analyzer - Job Description & CV Matching System

A powerful job description analyzer that matches candidates' CVs against job requirements using AI-powered skill extraction and matching algorithms.

## Features

- 📄 **PDF & DOCX Support**: Upload and process job descriptions and CVs in PDF or DOCX format
- 🤖 **AI-Powered Skill Extraction**: Automatically extracts relevant skills from documents
- 📊 **Smart Matching Algorithm**: Calculates match scores between job requirements and candidate skills
- 🎯 **Candidate Ranking**: Ranks candidates by compatibility percentage
- 💡 **Skill Gap Analysis**: Shows which skills candidates are missing
- 🌐 **Modern Web Interface**: Clean, responsive UI for easy use
- 🔒 **Robust Validation**: Comprehensive input validation and error handling

## Tech Stack

- **Backend**: Bun + TypeScript
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: SQLite (bun:sqlite)
- **File Processing**: pdf-parse, mammoth (for DOCX)
- **UI Components**: Radix UI + Lucide Icons

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) runtime installed

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

### Running the Application

1. Start the development server:
   ```bash
   bun run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

3. For production:
   ```bash
   bun run start
   ```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Health Check
- `GET /health` - Check if the server is running

#### Job Descriptions
- `GET /job-descriptions` - Get all job descriptions
- `POST /job-descriptions` - Upload a job description (PDF/DOCX)
- `GET /job-descriptions/:id` - Get a specific job description
- `DELETE /job-descriptions/:id` - Delete a job description

#### CVs
- `GET /cvs` - Get all CVs
- `POST /cvs` - Upload one or more CVs (PDF/DOCX, multiple files supported)
- `GET /cvs/:id` - Get a specific CV
- `DELETE /cvs/:id` - Delete a CV

#### Analysis
- `POST /analyze` - Analyze job description against selected CVs
  ```json
  {
    "jobDescriptionId": 1,
    "cvIds": [1, 2, 3]
  }
  ```
- `GET /analysis/:jobDescriptionId` - Get analysis results for a job description
- `DELETE /analysis/:jobDescriptionId` - Delete analysis results

## How to Use

1. **Upload Job Description**: Click "Upload Job Description" and select a PDF or DOCX file containing the job requirements.

2. **Upload CVs**: Click "Upload CVs" and select one or more candidate CV files (PDF or DOCX).

3. **Select Files**: Choose which job description and CVs you want to analyze.

4. **Analyze**: Click "Analyze Candidates" to process the matching.

5. **Review Results**: View the ranked candidates with:
   - Match percentage score
   - Skill-by-skill matching breakdown
   - Missing skills for each candidate

## Skill Extraction

The system automatically extracts skills from documents using:

- **Pattern Recognition**: Regex patterns for common technologies and skills
- **Domain-Based Matching**: Groups skills by categories (programming, cloud, databases, etc.)
- **Context Analysis**: Identifies skills mentioned in experience sections, bullet points, and skill lists

### Supported Skill Categories

- **Programming Languages**: JavaScript, Python, Java, C++, etc.
- **Web Technologies**: React, Vue, Angular, Node.js, etc.
- **Databases**: SQL, MongoDB, PostgreSQL, Redis, etc.
- **Cloud Platforms**: AWS, Azure, Google Cloud, Docker, Kubernetes
- **DevOps Tools**: Git, CI/CD, Jenkins, Testing frameworks
- **Design Tools**: Figma, Sketch, Adobe XD, Photoshop
- **Management Skills**: Agile, Scrum, Project Management, Leadership
- **And many more...**

## Matching Algorithm

The matching algorithm considers:

1. **Direct Skill Matches**: Exact or partial matches of required skills
2. **Domain Relevance**: Bonus points for skills in the same domain as required skills
3. **Scoring**: Calculated as a percentage based on matches vs. requirements
4. **Ranking**: Candidates are sorted by match score in descending order

## File Upload Limits

- **Maximum file size**: 10MB per file
- **Supported formats**: PDF, DOCX
- **Multiple CV upload**: Supported for batch processing

## Error Handling

The system includes comprehensive error handling for:
- Invalid file formats
- File size limits
- Corrupted documents
- Network issues
- Database errors
- Invalid API requests

## Development

### Type Checking
```bash
bun run type-check
```

### Building
```bash
bun run build
```

## Database Schema

The application uses SQLite with three main tables:

- **job_descriptions**: Stores uploaded job descriptions and extracted skills
- **cvs**: Stores uploaded CVs and extracted skills
- **analyses**: Stores analysis results and match calculations

## Contributing

1. Follow the existing code style and patterns
2. Add proper TypeScript types
3. Include error handling for new features
4. Test API endpoints thoroughly
5. Update documentation for any changes

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions, please create an issue in the repository.
# jd-analyzer
