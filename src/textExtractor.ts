import { PdfReader } from "pdfreader";
import mammoth from "mammoth";

export class TextExtractor {
  static async extractPDF(buffer: ArrayBuffer): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const pdfReader = new PdfReader();
        const result = Buffer.from(buffer);
        let fullText = '';

        pdfReader.parseBuffer(result, (err, item) => {
          if (err) {
            // Instead of rejecting, continue with extracted text
            if (fullText.length > 0) {
              resolve(fullText.trim());
            } else {
              reject(new Error(`Failed to extract PDF text: ${err}`));
            }
            return;
          }

          if (!item) {
            // End of PDF
            if (fullText.length > 0) {
              resolve(fullText.trim());
            } else {
              resolve('');
            }
            return;
          }

          if (item.text) {
            fullText += item.text + ' ';
          }
        });
      } catch (error) {
        reject(new Error(`Failed to extract PDF text: ${error}`));
      }
    });
  }

  static async extractDOCX(buffer: ArrayBuffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
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