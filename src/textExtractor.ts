import mammoth from "mammoth";

export class TextExtractor {
  static async extractPDF(buffer: ArrayBuffer): Promise<string> {
    try {
      // Method 1: Try to extract text streams from PDF structure
      const method1Result = await this.extractPDFMethod1(buffer);
      if (method1Result.length > 100) {
        return this.cleanExtractedText(method1Result);
      }

      // Method 2: Try binary text extraction with improved filtering
      const method2Result = await this.extractPDFMethod2(buffer);
      if (method2Result.length > 100) {
        return this.cleanExtractedText(method2Result);
      }

      // Method 3: Try stream-based extraction
      const method3Result = await this.extractPDFMethod3(buffer);
      if (method3Result.length > 100) {
        return this.cleanExtractedText(method3Result);
      }

      // If all methods fail, return empty string
      return '';

    } catch (error) {
      console.warn('All PDF extraction methods failed:', error);
      return '';
    }
  }

  // Method 1: Extract text from PDF object streams
  private static async extractPDFMethod1(buffer: ArrayBuffer): Promise<string> {
    try {
      const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      const textBlocks: string[] = [];

      // Look for text between stream and endstream
      const streamRegex = /stream\s*([\s\S]*?)\s*endstream/gi;
      let match;

      while ((match = streamRegex.exec(text)) !== null) {
        const streamContent = match[1];

        // Try to decode potential compressed text
        const decodedText = this.decodeStreamContent(streamContent);
        if (decodedText && decodedText.length > 10) {
          textBlocks.push(decodedText);
        }
      }

      // Look for text strings in PDF objects
      const stringRegex = /\(([^)]+)\)/g;
      let stringMatch;

      while ((stringMatch = stringRegex.exec(text)) !== null) {
        const candidate = stringMatch[1];
        if (this.isMeaningfulText(candidate)) {
          textBlocks.push(candidate);
        }
      }

      return textBlocks.join(' ').trim();
    } catch (error) {
      console.warn('Method 1 failed:', error);
      return '';
    }
  }

  // Method 2: Binary text extraction with better filtering
  private static async extractPDFMethod2(buffer: ArrayBuffer): Promise<string> {
    try {
      const uint8Array = new Uint8Array(buffer);
      const textChunks: string[] = [];
      let currentChunk = '';

      for (let i = 0; i < uint8Array.length; i++) {
        const byte = uint8Array[i];

        // Look for readable ASCII sequences
        if (byte >= 32 && byte <= 126) {
          currentChunk += String.fromCharCode(byte);
        } else if (byte === 10 || byte === 13 || byte === 9) {
          // End of text segment
          if (currentChunk.trim().length > 5) {
            const filtered = this.filterText(currentChunk.trim());
            if (filtered && filtered.length > 5) {
              textChunks.push(filtered);
            }
          }
          currentChunk = '';
        } else if (currentChunk.length > 20) {
          // Non-printable byte after substantial text
          const filtered = this.filterText(currentChunk.trim());
          if (filtered && filtered.length > 5) {
            textChunks.push(filtered);
          }
          currentChunk = '';
        }
      }

      // Process final chunk
      if (currentChunk.trim().length > 5) {
        const filtered = this.filterText(currentChunk.trim());
        if (filtered && filtered.length > 5) {
          textChunks.push(filtered);
        }
      }

      return textChunks.join(' ').trim();
    } catch (error) {
      console.warn('Method 2 failed:', error);
      return '';
    }
  }

  // Method 3: Look for text in specific PDF sections
  private static async extractPDFMethod3(buffer: ArrayBuffer): Promise<string> {
    try {
      const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      const textBlocks: string[] = [];

      // Look for text in page content areas
      const pageContentRegex = /\/Contents\s+(\d+\s+\d\s+R)/gi;
      let match;

      while ((match = pageContentRegex.exec(text)) !== null) {
        // Try to find object content
        const objectId = match[1];
        const objectRegex = new RegExp(`${objectId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<<[^>]*>>\\s*stream\\s*([\\s\\S]*?)\\s*endstream`, 'i');
        const objectMatch = objectRegex.exec(text);

        if (objectMatch && objectMatch[1]) {
          const content = this.extractTextFromStream(objectMatch[1]);
          if (content.length > 10) {
            textBlocks.push(content);
          }
        }
      }

      return textBlocks.join(' ').trim();
    } catch (error) {
      console.warn('Method 3 failed:', error);
      return '';
    }
  }

  private static decodeStreamContent(streamContent: string): string {
    try {
      // Try different decoding approaches

      // 1. Direct text
      if (this.isMeaningfulText(streamContent)) {
        return streamContent;
      }

      // 2. Try to decode hex content
      if (/^[0-9a-fA-F\s]+$/.test(streamContent)) {
        try {
          const hexString = streamContent.replace(/\s/g, '');
          let decoded = '';
          for (let i = 0; i < hexString.length; i += 2) {
            const hex = hexString.substr(i, 2);
            const charCode = parseInt(hex, 16);
            if (charCode >= 32 && charCode <= 126) {
              decoded += String.fromCharCode(charCode);
            }
          }
          if (this.isMeaningfulText(decoded)) {
            return decoded;
          }
        } catch (e) {
          // Continue to next method
        }
      }

      // 3. Try to find ASCII strings within the stream
      const asciiMatches = streamContent.match(/\(([A-Za-z0-9\s.,;!?]+)\)/g);
      if (asciiMatches) {
        const extracted = asciiMatches
          .map(match => match.slice(1, -1)) // Remove parentheses
          .filter(text => this.isMeaningfulText(text))
          .join(' ');
        if (extracted.length > 10) {
          return extracted;
        }
      }

      return '';
    } catch (error) {
      return '';
    }
  }

  private static extractTextFromStream(streamContent: string): string {
    try {
      // Remove common PDF operators and extract text
      let cleaned = streamContent;

      // Remove PDF operators
      cleaned = cleaned.replace(/\b(?:BT|ET|Td|Tm|Tf|Ts|Tj|TJ|cm|w|J|j|g|G|rg|RG|k|K|cs|CS|sc|SC|sh|SH|Do|q|Q|re|f|F|n|B|b|S|s)\b/g, ' ');

      // Remove hex strings
      cleaned = cleaned.replace(/<[0-9a-fA-F]+>/g, ' ');

      // Extract text from parentheses
      const textMatches = cleaned.match(/\(([^)]+)\)/g);
      if (textMatches) {
        return textMatches
          .map(match => match.slice(1, -1))
          .filter(text => this.isMeaningfulText(text))
          .join(' ');
      }

      return '';
    } catch (error) {
      return '';
    }
  }

  private static filterText(text: string): string | null {
    if (!this.isMeaningfulText(text)) {
      return null;
    }

    // Remove PDF-specific artifacts
    const artifacts = [
      'obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer', 'startxref',
      'Type', 'Subtype', 'Filter', 'Length', 'Resources', 'Font', 'Page',
      'Contents', 'Parent', 'Kids', 'Count', 'Rotate', 'MediaBox', 'CropBox',
      'BT', 'ET', 'Td', 'Tm', 'Tf', 'Ts', 'Tj', 'TJ', 'RG', 'rg', 'G', 'g',
      'CS', 'cs', 'SC', 'sc', 'K', 'k', 'w', 'j', 'J', 'M', 'd', 'i', 'I',
      'B', 'b', 'F', 'f', 'n', 's', 'S', 'q', 'Q', 'cm', 'Do', 'sh', 'SH'
    ];

    const lowerText = text.toLowerCase();
    if (artifacts.some(artifact => lowerText.includes(artifact))) {
      return null;
    }

    // Filter out pure numbers or coordinates
    if (/^\d+\.?\d*$/.test(text) || /^\d+\s+\d+\s*\d*\s*\d*$/.test(text)) {
      return null;
    }

    // Filter out hex strings
    if (/^[0-9a-fA-F\s]+$/.test(text)) {
      return null;
    }

    return text;
  }

  private static isMeaningfulText(text: string): boolean {
    if (!text || text.length < 3) {
      return false;
    }

    // Must contain at least some letters
    if (!/[a-zA-Z]/.test(text)) {
      return false;
    }

    // Must have reasonable word density (not just random characters)
    const words = text.split(/\s+/).filter(word => word.length > 2);
    if (words.length < 2 && text.length > 20) {
      return false;
    }

    // Not too many special characters
    const specialChars = text.match(/[^a-zA-Z0-9\s.,!?-]/g);
    if (specialChars && specialChars.length > text.length * 0.3) {
      return false;
    }

    return true;
  }

  private static cleanExtractedText(text: string): string {
    // Remove excessive whitespace
    let cleaned = text.replace(/\s+/g, ' ').trim();

    // Remove common PDF artifacts
    const pdfArtifacts = [
      /\b\d+\s*\d+\s*\d+\s*\d+\b/g, // Coordinates
      /\b\w+\s*\(\d+\)/g, // Font references
      /\b(?:BT|ET|Td|Tm|Tf|Ts|Tj|TJ|cm|w|J|j|g|G|rg|RG|k|K|cs|CS|sc|SC|sh|SH)\b/g, // PDF operators
      /\b(?:obj|endobj|stream|endstream|xref|startxref|trailer)\b/gi, // PDF structure
    ];

    pdfArtifacts.forEach(artifact => {
      cleaned = cleaned.replace(artifact, ' ');
    });

    // Remove very short words (likely artifacts)
    cleaned = cleaned.replace(/\b\w{1,2}\b/g, '');

    // Clean up extra spaces again
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
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