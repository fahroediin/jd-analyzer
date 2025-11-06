import mammoth from "mammoth";

export class TextExtractor {
  static async extractPDF(buffer: ArrayBuffer): Promise<string> {
    try {
      // For PDF files, we'll try to extract readable text from the binary data
      // This is a simplified approach that works for basic text extraction
      const uint8Array = new Uint8Array(buffer);
      const textChunks: string[] = [];
      let currentText = '';

      for (let i = 0; i < uint8Array.length; i++) {
        const char = uint8Array[i];

        // Extract readable ASCII characters that form words
        if (char >= 32 && char <= 126) {
          currentText += String.fromCharCode(char);
        } else if (char === 10 || char === 13) {
          // New line - end of text chunk
          if (currentText.trim().length > 2) {
            // Filter out very short chunks that are likely random characters
            textChunks.push(currentText.trim());
          }
          currentText = '';
        } else if (currentText.length > 0) {
          // Non-printable character, end of word
          if (currentText.length > 2) {
            textChunks.push(currentText);
          }
          currentText = '';
        }
      }

      // Add the last chunk if any
      if (currentText.length > 2) {
        textChunks.push(currentText);
      }

      // Filter out common PDF artifacts and random strings
      const meaningfulTexts = textChunks.filter(text => {
        // Must be reasonable length
        if (text.length < 3 || text.length > 100) return false;

        // Must contain letters
        if (!/[a-zA-Z]/.test(text)) return false;

        // Filter out PDF-specific artifacts more aggressively
        const pdfArtifacts = [
          'endobj', 'stream', 'obj', 'null', 'false', 'true', 'R', 'G', 'B', 'C',
          'Type', 'Font', 'Encoding', 'MediaBox', 'Parent', 'Resources', 'Rotate',
          'Trans', 'PageMode', 'UseNone', 'Pages', 'Catalog', 'Subject', 'Title',
          'Trapped', 'Count', 'Kids', 'Filter', 'ASCII85Decode', 'FlateDecode',
          'Length', 'xref', 'startxref', 'Root', 'BaseFont', 'Helvetica', 'WinAnsiEncoding',
          'Subtype', 'Contents', 'ProcSet', 'PDF', 'Text', 'ImageB', 'ImageC', 'ImageI',
          'ReportLab', 'generated', 'document', 'http', 'www.reportlab.com', 'digest',
          'anonymous', 'unspecified'
        ];
        if (pdfArtifacts.some(artifact => text.toLowerCase().includes(artifact.toLowerCase()))) {
          return false;
        }

        // Filter out hex-like strings
        if (/^[0-9a-fA-F]+$/.test(text) && text.length > 4) return false;

        // Filter out random character strings (high entropy)
        const uniqueChars = new Set(text.toLowerCase()).size;
        if (text.length > 5 && uniqueChars / text.length > 0.8) return false;

        // Filter out strings with too many special characters
        const specialCharCount = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
        if (specialCharCount / text.length > 0.3) return false;

        // Filter out numbers and coordinates
        if (/^\d+$/.test(text)) return false;
        if (/^\d+\s+\d+\s+\d+\s+\d+$/.test(text)) return false;

        return true;
      });

      const extractedText = meaningfulTexts.join(' ').trim();

      // If we got some meaningful text, use it. Otherwise, provide a fallback.
      if (extractedText.length > 100) {
        return extractedText;
      }

      // Return empty content when PDF extraction fails
      // This prevents fallback text from being used for skill extraction
      return "";
    } catch (error) {
      // Return empty content when PDF extraction fails
      // This prevents fallback text from being used for skill extraction
      return "";
    }
  }

  static async extractDOCX(buffer: ArrayBuffer): Promise<string> {
    try {
      // Convert ArrayBuffer to Buffer for mammoth compatibility
      const nodeBuffer = Buffer.from(buffer);
      const result = await mammoth.extractRawText({ buffer: nodeBuffer });
      return result.value;
    } catch (error) {
      throw new Error(`Failed to extract DOCX text: ${error}`);
    }
  }

  static async extractText(buffer: ArrayBuffer, filename: string): Promise<string> {
    const extension = filename.toLowerCase().split('.').pop();

    switch (extension) {
      case 'pdf':
        return await this.extractPDF(buffer);
      case 'docx':
        return await this.extractDOCX(buffer);
      case 'txt':
        return await this.extractTXT(buffer);
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }
  }

  static async extractTXT(buffer: ArrayBuffer): Promise<string> {
    try {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(buffer);
    } catch (error) {
      throw new Error(`Failed to extract text from TXT file: ${error}`);
    }
  }
}