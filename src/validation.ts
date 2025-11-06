export interface ValidationError {
  field: string;
  message: string;
}

export class FileValidator {
  static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  static readonly ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/plain;charset=utf-8"
  ];
  static readonly ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

  static validateFile(file: File): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push({
        field: "size",
        message: `File size must be less than ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      errors.push({
        field: "type",
        message: "Only PDF, DOCX, and TXT files are allowed"
      });
    }

    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
      errors.push({
        field: "extension",
        message: "File must have .pdf, .docx, or .txt extension"
      });
    }

    // Check filename
    if (file.name.trim().length === 0) {
      errors.push({
        field: "filename",
        message: "Filename cannot be empty"
      });
    }

    return errors;
  }

  static validateFiles(files: File[]): ValidationError[] {
    const errors: ValidationError[] = [];

    if (files.length === 0) {
      errors.push({
        field: "files",
        message: "At least one file must be provided"
      });
      return errors;
    }

    files.forEach((file, index) => {
      const fileErrors = this.validateFile(file);
      fileErrors.forEach(error => {
        errors.push({
          ...error,
          field: `file_${index}_${error.field}`,
          message: `${file.name}: ${error.message}`
        });
      });
    });

    return errors;
  }
}

export class AnalysisValidator {
  static validateAnalysisRequest(jobDescriptionId: any, cvIds: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate job description ID
    if (jobDescriptionId === null || jobDescriptionId === undefined) {
      errors.push({
        field: "jobDescriptionId",
        message: "Job description ID is required"
      });
    } else if (!Number.isInteger(jobDescriptionId) || jobDescriptionId <= 0) {
      errors.push({
        field: "jobDescriptionId",
        message: "Job description ID must be a positive integer"
      });
    }

    // Validate CV IDs
    if (!cvIds) {
      errors.push({
        field: "cvIds",
        message: "CV IDs array is required"
      });
    } else if (!Array.isArray(cvIds)) {
      errors.push({
        field: "cvIds",
        message: "CV IDs must be an array"
      });
    } else if (cvIds.length === 0) {
      errors.push({
        field: "cvIds",
        message: "At least one CV must be selected"
      });
    } else {
      cvIds.forEach((cvId, index) => {
        if (!Number.isInteger(cvId) || cvId <= 0) {
          errors.push({
            field: `cvIds[${index}]`,
            message: "Each CV ID must be a positive integer"
          });
        }
      });

      // Check for duplicate IDs
      const uniqueIds = [...new Set(cvIds)];
      if (uniqueIds.length !== cvIds.length) {
        errors.push({
          field: "cvIds",
          message: "CV IDs must be unique"
        });
      }
    }

    return errors;
  }
}

export class RequestValidator {
  static validateContentType(req: Request, expectedType: string): ValidationError | null {
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes(expectedType)) {
      return {
        field: "content-type",
        message: `Expected ${expectedType}, got ${contentType || "none"}`
      };
    }
    return null;
  }

  static validateId(id: string, fieldName: string = "id"): ValidationError | null {
    const numId = parseInt(id);
    if (isNaN(numId) || numId <= 0) {
      return {
        field: fieldName,
        message: `${fieldName} must be a positive integer`
      };
    }
    return null;
  }
}

export class ErrorHandler {
  static createErrorResponse(errors: ValidationError[], status: number = 400): Response {
    return Response.json({
      error: "Validation failed",
      details: errors
    }, { status });
  }

  static createGenericErrorResponse(message: string, status: number = 500): Response {
    console.error(message);
    return Response.json({ error: message }, { status });
  }

  static async asyncWrapper<T>(
    asyncFn: () => Promise<T>,
    errorMessage: string = "Internal server error"
  ): Promise<{ data?: T; error?: Response }> {
    try {
      const data = await asyncFn();
      return { data };
    } catch (error) {
      console.error(errorMessage, error);
      return {
        error: this.createGenericErrorResponse(
          error instanceof Error ? error.message : errorMessage
        )
      };
    }
  }
}