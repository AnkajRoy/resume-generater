import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { SupabaseService } from './supabase.service';
import { ResumeData } from '../models/resume.model';

export const MAX_IMPORT_FILE_SIZE = 2 * 1024 * 1024; // 2MB

@Injectable({ providedIn: 'root' })
export class ResumeImportService {
  constructor(private supabase: SupabaseService) {}

  /** Returns an error message, or null if the file is acceptable. */
  validateFile(file: File): string | null {
    const name = file.name.toLowerCase();
    const isPdf = name.endsWith('.pdf');
    const isDocx = name.endsWith('.docx');

    if (!isPdf && !isDocx) {
      if (name.endsWith('.doc')) {
        return "Old .doc files aren't supported — please save it as PDF or .docx and try again.";
      }
      return 'Only PDF or .docx files are supported.';
    }
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      return 'File is too large — please upload a file under 2MB.';
    }
    return null;
  }

  async extractText(file: File): Promise<string> {
    const name = file.name.toLowerCase();
    const text = name.endsWith('.pdf') ? await this.extractPdfText(file) : await this.extractDocxText(file);

    if (!text || text.trim().length < 30) {
      throw new Error("Couldn't read enough text from that file — it may be a scanned image rather than real text.");
    }
    return text;
  }

  async parseWithAI(text: string): Promise<ResumeData> {
    const { data, error } = await this.supabase.client.functions.invoke('parse-resume', {
      body: { text }
    });

    if (error) {
      throw new Error(error.message ?? 'Resume import failed.');
    }
    if (!data?.data) {
      throw new Error(data?.error ?? 'Resume import failed — the AI service may be temporarily unavailable.');
    }
    return data.data as ResumeData;
  }

  private async extractPdfText(file: File): Promise<string> {
    const baseHref = document.querySelector('base')?.getAttribute('href') ?? '/';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}${baseHref}assets/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
    return text;
  }

  private async extractDocxText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
}
