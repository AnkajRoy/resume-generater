import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { ResumeData } from '../models/resume.model';

@Injectable({ providedIn: 'root' })
export class PdfGeneratorService {

  generate(data: ResumeData): void {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const W = 612, L = 40, R = W - 40, pw = R - L;
    let y = 36;

    const C = {
      bk: [20, 20, 20] as number[],
      dk: [40, 40, 40] as number[],
      md: [80, 80, 80] as number[],
      gy: [110, 110, 110] as number[],
      lt: [150, 150, 150] as number[],
      bl: [26, 95, 180] as number[],
      wh: [255, 255, 255] as number[],
      bg: [240, 244, 248] as number[]
    };

    function f(sz: number, st?: string) {
      doc.setFont('helvetica', st || 'normal');
      doc.setFontSize(sz);
    }
    function tc(c: number[]) { doc.setTextColor(c[0], c[1], c[2]); }
    function dc(c: number[]) { doc.setDrawColor(c[0], c[1], c[2]); }

    function hr(thick?: number) {
      dc(C.bk); doc.setLineWidth(thick || 0.8);
      doc.line(L, y, R, y); y += 10;
    }

    function wrap(txt: string, x: number, mw: number, lh: number) {
      const ls = doc.splitTextToSize(txt, mw);
      for (let i = 0; i < ls.length; i++) { doc.text(ls[i], x, y); y += lh; }
    }

    function sHead(t: string) {
      f(9.5, 'bold'); tc(C.bk);
      doc.text(t, L, y);
      y += 6;
      dc(C.bk); doc.setLineWidth(0.6);
      doc.line(L, y, R, y);
      y += 11;
    }

    function sub(t: string) {
      f(7.5, 'bold'); tc(C.bl);
      doc.text(t, L, y); y += 11;
    }

    function bul(txt: string) {
      f(8.2, 'normal'); tc(C.dk);
      const ls = doc.splitTextToSize(txt, pw - 16);
      doc.text('\u2022', L + 3, y);
      for (let i = 0; i < ls.length; i++) { doc.text(ls[i], L + 14, y); y += 11; }
      y += 0.5;
    }

    // ========== HEADER ==========
    doc.setFillColor(26, 95, 180);
    doc.rect(0, 0, W, 3, 'F');

    y = 30;
    f(22, 'bold'); tc(C.bk);
    doc.text(data.personalInfo.name.toUpperCase(), W / 2, y, { align: 'center' });
    y += 17;

    f(11, 'normal'); tc(C.md);
    doc.text(data.personalInfo.title, W / 2, y, { align: 'center' });
    y += 15;

    f(8, 'normal'); tc(C.gy);
    let contactX = 108;
    const p = data.personalInfo;

    doc.text(p.phone, contactX, y);
    doc.text('  |  ', contactX + 72, y);
    tc(C.bl);
    doc.textWithLink(p.email, contactX + 84, y, { url: 'mailto:' + p.email });
    tc(C.gy); doc.text('  |  ', contactX + 180, y);
    tc(C.bl);
    doc.textWithLink('LinkedIn', contactX + 193, y, { url: p.linkedin });
    tc(C.gy); doc.text('  |  ', contactX + 222, y);
    tc(C.bl);
    doc.textWithLink('GitHub', contactX + 235, y, { url: p.github });
    tc(C.gy); doc.text('  |  ', contactX + 260, y);
    tc(C.bl);
    doc.textWithLink('LeetCode', contactX + 273, y, { url: p.leetcode });
    y += 13;

    hr(1);

    // ========== SUMMARY ==========
    sHead('PROFESSIONAL SUMMARY');
    f(8.5, 'normal'); tc(C.dk);
    wrap(data.summary, L, pw - 4, 12);
    y += 4;

    // ========== EXPERIENCE ==========
    sHead('PROFESSIONAL EXPERIENCE');

    data.experiences.forEach(exp => {
      f(9.5, 'bold'); tc(C.bk);
      doc.text(exp.company, L, y);
      f(9.5, 'normal'); tc(C.md);
      doc.text(' \u2014 ' + exp.role, L + doc.getTextWidth(exp.company), y);
      f(8.5, 'normal'); tc(C.gy);
      doc.text(exp.dateRange, R, y, { align: 'right' });
      y += 13;

      if (exp.subtitle) {
        f(7.5, 'italic'); tc(C.gy);
        doc.text(exp.subtitle, L, y);
        y += 15;
      }

      exp.subsections.forEach(ss => {
        sub(ss.title);
        ss.bullets.forEach(b => bul(b));
        y += 4;
      });
    });

    // ========== PROJECTS ==========
    sHead('KEY PROJECTS & OWNERSHIP');

    data.projects.forEach(proj => {
      f(8.2, 'bold'); tc(C.bk);
      doc.text(proj.name, L, y);
      const nw = doc.getTextWidth(proj.name);
      f(8.2, 'normal'); tc(C.md);
      doc.text(proj.description, L + nw, y);
      y += 11;
      f(7, 'normal'); tc(C.bl);
      doc.textWithLink(proj.githubText, L + 8, y, { url: proj.githubUrl });
      y += 13;
    });
    y += 2;

    // ========== SKILLS ==========
    sHead('TECHNICAL SKILLS');

    data.skills.forEach(s => {
      f(8.2, 'bold'); tc(C.dk);
      doc.text(s.label, L, y);
      const lw = doc.getTextWidth(s.label);
      f(8.2, 'normal'); tc(C.dk);
      const lines = doc.splitTextToSize(s.value, pw - lw);
      doc.text(lines[0], L + lw, y);
      y += 12;
      for (let i = 1; i < lines.length; i++) { doc.text(lines[i], L + lw, y); y += 12; }
    });
    y += 4;

    // ========== EDUCATION ==========
    sHead('EDUCATION');
    const edu = data.education;
    f(8.5, 'bold'); tc(C.bk);
    doc.text(edu.degree, L, y);
    f(8.5, 'normal'); tc(C.dk);
    doc.text(
      ' \u2014 ' + edu.institution + '  |  ' + edu.year + '  |  CGPA: ' + edu.cgpa,
      L + doc.getTextWidth(edu.degree), y
    );
    y += 14;

    // ========== ACHIEVEMENTS ==========
    sHead('ACHIEVEMENTS & COMPETITIVE PROGRAMMING');
    data.achievements.forEach(a => bul(a));

    // Bottom accent bar
    doc.setFillColor(26, 95, 180);
    doc.rect(0, 789, W, 3, 'F');

    const fileName = data.personalInfo.name.replace(/\s+/g, '_') + '_Resume.pdf';
    doc.save(fileName);
  }
}
