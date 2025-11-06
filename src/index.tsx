import { serve } from "bun";
import index from "./index.html";
import { TextExtractor } from "./textExtractor";
import { JobDescriptionService, CVService, AnalysisService } from "./services";
import { FileValidator, AnalysisValidator, RequestValidator, ErrorHandler } from "./validation";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    // Job Description endpoints
    "/api/job-descriptions": {
      async GET() {
        const result = await ErrorHandler.asyncWrapper(
          () => JobDescriptionService.getAll(),
          "Failed to fetch job descriptions"
        );
        return result.error || Response.json(result.data);
      },

      async POST(req) {
        // Validate content type
        const contentTypeError = RequestValidator.validateContentType(req, "multipart/form-data");
        if (contentTypeError) {
          return ErrorHandler.createErrorResponse([contentTypeError]);
        }

        try {
          const formData = await req.formData();
          const file = formData.get("file") as File;

          // Validate file
          if (!file) {
            return ErrorHandler.createErrorResponse([{
              field: "file",
              message: "No file provided"
            }]);
          }

          console.log('File received:', file.name, file.type);
          const fileErrors = FileValidator.validateFile(file);
          if (fileErrors.length > 0) {
            return ErrorHandler.createErrorResponse(fileErrors);
          }

          // Process file
          const result = await ErrorHandler.asyncWrapper(async () => {
            const buffer = await file.arrayBuffer();
            const text = await TextExtractor.extractText(buffer, file.name);
            return await JobDescriptionService.create(file.name, text);
          }, "Failed to process job description");

          return result.error || Response.json(result.data, { status: 201 });
        } catch (error) {
          return ErrorHandler.createGenericErrorResponse("Failed to upload job description");
        }
      },
    },

    "/api/job-descriptions/:id": {
      async GET(req) {
        const idError = RequestValidator.validateId(req.params.id, "id");
        if (idError) {
          return ErrorHandler.createErrorResponse([idError]);
        }

        const result = await ErrorHandler.asyncWrapper(async () => {
          const id = parseInt(req.params.id);
          const jobDescription = await JobDescriptionService.findById(id);
          if (!jobDescription) {
            throw new Error("Job description not found");
          }
          return jobDescription;
        }, "Failed to fetch job description");

        if (result.error) {
          if (result.error.status === 500) {
            return result.error;
          }
          return ErrorHandler.createErrorResponse([{
            field: "id",
            message: "Job description not found"
          }], 404);
        }

        return Response.json(result.data);
      },

      async DELETE(req) {
        const idError = RequestValidator.validateId(req.params.id, "id");
        if (idError) {
          return ErrorHandler.createErrorResponse([idError]);
        }

        const result = await ErrorHandler.asyncWrapper(async () => {
          const id = parseInt(req.params.id);
          const success = await JobDescriptionService.delete(id);
          if (!success) {
            throw new Error("Job description not found");
          }
          return success;
        }, "Failed to delete job description");

        if (result.error) {
          if (result.error.status === 500) {
            return result.error;
          }
          return ErrorHandler.createErrorResponse([{
            field: "id",
            message: "Job description not found"
          }], 404);
        }

        return Response.json({ message: "Job description deleted successfully" });
      },
    },

    // CV endpoints
    "/api/cvs": {
      async GET() {
        const result = await ErrorHandler.asyncWrapper(
          () => CVService.getAll(),
          "Failed to fetch CVs"
        );
        return result.error || Response.json(result.data);
      },

      async POST(req) {
        // Validate content type
        const contentTypeError = RequestValidator.validateContentType(req, "multipart/form-data");
        if (contentTypeError) {
          return ErrorHandler.createErrorResponse([contentTypeError]);
        }

        try {
          const formData = await req.formData();
          const files = formData.getAll("files") as File[];

          // Validate files
          const fileErrors = FileValidator.validateFiles(files);
          if (fileErrors.length > 0) {
            return ErrorHandler.createErrorResponse(fileErrors);
          }

          // Process files
          const result = await ErrorHandler.asyncWrapper(async () => {
            const uploadedCVs = [];
            for (const file of files) {
              const buffer = await file.arrayBuffer();
              const text = await TextExtractor.extractText(buffer, file.name);
              const cv = await CVService.create(file.name, text);
              uploadedCVs.push(cv);
            }
            return uploadedCVs;
          }, "Failed to process CVs");

          return result.error || Response.json(result.data, { status: 201 });
        } catch (error) {
          return ErrorHandler.createGenericErrorResponse("Failed to upload CVs");
        }
      },
    },

    "/api/cvs/:id": {
      async GET(req) {
        const idError = RequestValidator.validateId(req.params.id, "id");
        if (idError) {
          return ErrorHandler.createErrorResponse([idError]);
        }

        const result = await ErrorHandler.asyncWrapper(async () => {
          const id = parseInt(req.params.id);
          const cv = await CVService.findById(id);
          if (!cv) {
            throw new Error("CV not found");
          }
          return cv;
        }, "Failed to fetch CV");

        if (result.error) {
          if (result.error.status === 500) {
            return result.error;
          }
          return ErrorHandler.createErrorResponse([{
            field: "id",
            message: "CV not found"
          }], 404);
        }

        return Response.json(result.data);
      },

      async DELETE(req) {
        const idError = RequestValidator.validateId(req.params.id, "id");
        if (idError) {
          return ErrorHandler.createErrorResponse([idError]);
        }

        const result = await ErrorHandler.asyncWrapper(async () => {
          const id = parseInt(req.params.id);
          const success = await CVService.delete(id);
          if (!success) {
            throw new Error("CV not found");
          }
          return success;
        }, "Failed to delete CV");

        if (result.error) {
          if (result.error.status === 500) {
            return result.error;
          }
          return ErrorHandler.createErrorResponse([{
            field: "id",
            message: "CV not found"
          }], 404);
        }

        return Response.json({ message: "CV deleted successfully" });
      },
    },

    // Analysis endpoints
    "/api/analyze": {
      async POST(req) {
        try {
          const body = await req.json();
          const { jobDescriptionId, cvIds } = body;

          // Validate request
          const validationErrors = AnalysisValidator.validateAnalysisRequest(jobDescriptionId, cvIds);
          if (validationErrors.length > 0) {
            return ErrorHandler.createErrorResponse(validationErrors);
          }

          // Perform analysis
          const result = await ErrorHandler.asyncWrapper(async () => {
            const results = await AnalysisService.analyze(jobDescriptionId, cvIds);
            const sortedResults = results.sort((a, b) => b.matchScore - a.matchScore);

            const jobDescription = await JobDescriptionService.findById(jobDescriptionId);
            if (!jobDescription) {
              throw new Error("Job description not found");
            }

            return {
              jobDescription,
              results,
              sortedCandidates: sortedResults
            };
          }, "Failed to perform analysis");

          return result.error || Response.json(result.data);
        } catch (error) {
          if (error instanceof SyntaxError) {
            return ErrorHandler.createErrorResponse([{
              field: "body",
              message: "Invalid JSON in request body"
            }]);
          }
          return ErrorHandler.createGenericErrorResponse("Failed to perform analysis");
        }
      },
    },

    "/api/analysis/:jobDescriptionId": {
      async GET(req) {
        const idError = RequestValidator.validateId(req.params.jobDescriptionId, "jobDescriptionId");
        if (idError) {
          return ErrorHandler.createErrorResponse([idError]);
        }

        const result = await ErrorHandler.asyncWrapper(async () => {
          const jobDescriptionId = parseInt(req.params.jobDescriptionId);
          const results = await AnalysisService.getAnalysisResults(jobDescriptionId);
          return results;
        }, "Failed to fetch analysis results");

        return result.error || Response.json(result.data);
      },

      async DELETE(req) {
        const idError = RequestValidator.validateId(req.params.jobDescriptionId, "jobDescriptionId");
        if (idError) {
          return ErrorHandler.createErrorResponse([idError]);
        }

        const result = await ErrorHandler.asyncWrapper(async () => {
          const jobDescriptionId = parseInt(req.params.jobDescriptionId);
          await AnalysisService.deleteAnalysis(jobDescriptionId);
          return true;
        }, "Failed to delete analysis results");

        return result.error || Response.json({ message: "Analysis results deleted successfully" });
      },
    },

    // Health check endpoint
    "/api/health": {
      async GET() {
        return Response.json({
          status: "ok",
          timestamp: new Date().toISOString(),
          version: "1.0.0"
        });
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 JD Analyzer Server running at ${server.url}`);
console.log(`📊 API Documentation:`);
console.log(`  GET  /api/health - Health check`);
console.log(`  GET  /api/job-descriptions - Get all job descriptions`);
console.log(`  POST /api/job-descriptions - Upload job description (PDF/DOCX)`);
console.log(`  GET  /api/job-descriptions/:id - Get specific job description`);
console.log(`  DELETE /api/job-descriptions/:id - Delete job description`);
console.log(`  GET  /api/cvs - Get all CVs`);
console.log(`  POST /api/cvs - Upload CVs (PDF/DOCX, multiple files)`);
console.log(`  GET  /api/cvs/:id - Get specific CV`);
console.log(`  DELETE /api/cvs/:id - Delete CV`);
console.log(`  POST /api/analyze - Analyze job description against CVs`);
console.log(`  GET  /api/analysis/:jobDescriptionId - Get analysis results`);
console.log(`  DELETE /api/analysis/:jobDescriptionId - Delete analysis results`);
