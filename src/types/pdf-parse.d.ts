declare module 'pdf-parse/lib/pdf-parse' {
    import { Buffer } from 'buffer';
  
    interface PDFInfo {
      numpages: number;
      numrender: number;
      info: any;
      metadata: any;
      version: string;
      text: string;
    }
  
    function pdf(buffer: Buffer): Promise<PDFInfo>;
  
    export = pdf;
  }