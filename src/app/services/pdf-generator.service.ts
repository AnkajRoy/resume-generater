import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { ResumeData } from '../models/resume.model';

@Injectable({ providedIn: 'root' })
export class PdfGeneratorService {

  /** Stamps a repeated, low-opacity diagonal watermark across every page — used only for public sample downloads. */
  private stampWatermark(doc: jsPDF, text: string, pageW: number, pageH: number): void {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.saveGraphicsState();
      doc.setGState(doc.GState({ opacity: 0.09 }));
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(120, 120, 120);
      const stepX = 190, stepY = 130;
      for (let yy = -40; yy < pageH + 80; yy += stepY) {
        for (let xx = -60; xx < pageW + 120; xx += stepX) {
          doc.text(text, xx, yy, { angle: 35 });
        }
      }
      doc.restoreGraphicsState();
    }
  }

  generate(data: ResumeData, watermark?: string): void {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const W = 612, L = 30, R = W - 30, pw = R - L;
    const PAGE_H = 792;
    const SAFE_BOT = 787;   // leaves 3 pt gap above the footer bar
    let y = 0;

    const C = {
      bk: [20, 20, 20] as number[],
      dk: [40, 40, 40] as number[],
      md: [80, 80, 80] as number[],
      gy: [110, 110, 110] as number[],
      bl: [26, 95, 180] as number[]
    };

    const f  = (sz: number, st = 'normal') => { doc.setFont('helvetica', st); doc.setFontSize(sz); };
    const tc = (c: number[]) => doc.setTextColor(c[0], c[1], c[2]);
    const dc = (c: number[]) => doc.setDrawColor(c[0], c[1], c[2]);
    const clean = (s: string) => s.replace(/\*\*/g, '');

    const footerBar = () => {
      doc.setFillColor(C.bl[0], C.bl[1], C.bl[2]);
      doc.rect(0, PAGE_H - 3, W, 3, 'F');
    };

    const newPage = () => {
      footerBar();
      doc.addPage();
      doc.setFillColor(C.bl[0], C.bl[1], C.bl[2]);
      doc.rect(0, 0, W, 3, 'F');
      y = 36;
    };

    const checkPage = (need = 22) => { if (y + need > SAFE_BOT) newPage(); };

    function sHead(t: string) {
      checkPage(27);
      f(9.5, 'bold'); tc(C.bk);
      doc.text(t, L, y); y += 6;
      dc(C.bk); doc.setLineWidth(0.6);
      doc.line(L, y, R, y); y += 10;
    }

    function sub(t: string) {
      checkPage(20);
      f(7.5, 'bold'); tc(C.bl);
      doc.text(t, L, y); y += 10;
    }

    function bul(txt: string) {
      f(8, 'normal'); tc(C.dk);
      const ls = doc.splitTextToSize(clean(txt), pw - 18);
      checkPage(ls.length * 11.3 + 2);
      doc.text('•', L + 3, y);
      ls.forEach((l: string) => { doc.text(l, L + 14, y); y += 11.3; });
    }

    // ── HEADER ──────────────────────────────────────────────────────────────
    doc.setFillColor(C.bl[0], C.bl[1], C.bl[2]);
    doc.rect(0, 0, W, 3, 'F');

    y = 30;
    f(21, 'bold'); tc(C.bk);
    doc.text(data.personalInfo.name.toUpperCase(), W / 2, y, { align: 'center' });
    y += 15;

    f(10.5, 'normal'); tc(C.md);
    doc.text(data.personalInfo.title, W / 2, y, { align: 'center' });
    y += 13;

    // contact row — dynamically centered
    f(7.8, 'normal');
    const p = data.personalInfo;
    const sep = '  |  ';
    type CPart = { text: string; url: string | null; link: boolean };
    const parts: CPart[] = [];
    if (p.phone)    parts.push({ text: p.phone,    url: null,                link: false });
    if (p.email)    parts.push({ text: p.email,    url: 'mailto:' + p.email, link: true  });
    if (p.linkedin) parts.push({ text: 'LinkedIn', url: p.linkedin,          link: true  });
    if (p.github)   parts.push({ text: 'GitHub',   url: p.github,            link: true  });
    if (p.leetcode) parts.push({ text: 'LeetCode', url: p.leetcode,          link: true  });

    const tw = parts.reduce((s, pt, i) =>
      s + doc.getTextWidth(pt.text) + (i < parts.length - 1 ? doc.getTextWidth(sep) : 0), 0);
    let cx = (W - tw) / 2;
    parts.forEach((pt, i) => {
      if (pt.link) { tc(C.bl); doc.textWithLink(pt.text, cx, y, { url: pt.url! }); }
      else          { tc(C.gy); doc.text(pt.text, cx, y); }
      cx += doc.getTextWidth(pt.text);
      if (i < parts.length - 1) { tc(C.gy); doc.text(sep, cx, y); cx += doc.getTextWidth(sep); }
    });
    y += 11;

    dc(C.bk); doc.setLineWidth(1); doc.line(L, y, R, y); y += 18;

    // ── SUMMARY ─────────────────────────────────────────────────────────────
    sHead('PROFESSIONAL SUMMARY');
    f(8.5, 'normal'); tc(C.dk);
    doc.splitTextToSize(clean(data.summary), pw).forEach((l: string) => { doc.text(l, L, y); y += 11.3; });
    y += 4;

    // ── EXPERIENCE ──────────────────────────────────────────────────────────
    sHead('WORK EXPERIENCE');

    data.experiences.forEach(exp => {
      checkPage(22);
      f(9.5, 'bold'); tc(C.bk);
      doc.text(exp.company, L, y);
      f(9.5, 'normal'); tc(C.md);
      doc.text(' — ' + exp.role, L + doc.getTextWidth(exp.company), y);
      f(8.5, 'normal'); tc(C.gy);
      doc.text(exp.dateRange, R, y, { align: 'right' });
      y += 12;

      if (exp.subtitle) {
        f(7.5, 'italic'); tc(C.gy);
        doc.splitTextToSize(exp.subtitle, pw).forEach((l: string) => { doc.text(l, L, y); y += 9; });
        y += 4;
      }

      exp.subsections.forEach((ss, ssIdx) => {
        if (ssIdx > 0) { checkPage(10); y += 5; }
        ss.bullets.forEach(b => bul(b));
        y += 4;
      });
    });

    // ── PROJECTS ────────────────────────────────────────────────────────────
    sHead('PROJECTS');

    data.projects.forEach(proj => {
      checkPage(22);
      f(8, 'bold'); tc(C.bk);
      const nw = doc.getTextWidth(proj.name);
      doc.text(proj.name, L, y);
      if (proj.description) {
        f(7.5, 'normal'); tc(C.md);
        const dl = doc.splitTextToSize('  —  ' + proj.description, pw - nw);
        doc.text(dl[0], L + nw, y); y += 11.3;
        for (let i = 1; i < dl.length; i++) { doc.text(dl[i], L + 10, y); y += 11.3; }
      } else { y += 11.3; }
      if (proj.githubText) {
        f(7, proj.githubUrl ? 'normal' : 'italic');
        if (proj.githubUrl) {
          tc(C.bl);
          doc.textWithLink(proj.githubText, L + 8, y, { url: proj.githubUrl });
        } else {
          tc(C.gy);
          doc.text(proj.githubText, L + 8, y);
        }
        y += 12;
      } else {
        y += 6;
      }
    });
    y += 4;

    // ── SKILLS ──────────────────────────────────────────────────────────────
    sHead('SKILLS');

    data.skills.forEach(s => {
      checkPage(15);
      f(8, 'bold'); tc(C.dk); doc.text(s.label, L, y);
      const lw = doc.getTextWidth(s.label);
      f(8, 'normal'); tc(C.dk);
      const sl = doc.splitTextToSize(s.value, pw - lw);
      doc.text(sl[0], L + lw, y); y += 11.3;
      for (let i = 1; i < sl.length; i++) { doc.text(sl[i], L + lw, y); y += 11.3; }
      y += 2;
    });
    y += 2;

    // ── EDUCATION ───────────────────────────────────────────────────────────
    sHead('EDUCATION');
    checkPage(14);
    const edu = data.education;
    f(8.5, 'bold'); tc(C.bk); doc.text(edu.degree, L, y);
    f(8.5, 'normal'); tc(C.dk);
    doc.text(' — ' + edu.institution + '  |  ' + edu.year + '  |  CGPA: ' + edu.cgpa,
      L + doc.getTextWidth(edu.degree), y);
    y += 17;

    // ── ACHIEVEMENTS ────────────────────────────────────────────────────────
    sHead('ACHIEVEMENTS & COMPETITIVE PROGRAMMING');
    data.achievements.forEach(a => bul(a));

    footerBar();

    if (watermark) {
      this.stampWatermark(doc, watermark, W, PAGE_H);
    }

    doc.save(data.personalInfo.name.replace(/\s+/g, '_') + '_Resume.pdf');
  }

  // ── MODERN TWO-COLUMN TEMPLATE (separate from generate() above) ──────────
  generateModern(data: ResumeData, watermark?: string): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = 595.28, PAGE_H = 841.89, M = 34, R = W - M, cw = R - M;
    const TOP = 34, SAFE_BOT = PAGE_H - 36;

    const C = {
      bk: [20, 20, 20] as number[],
      dk: [45, 45, 45] as number[],
      md: [90, 90, 90] as number[],
      gy: [130, 130, 130] as number[],
      bl: [26, 95, 180] as number[],
      ln: [205, 205, 205] as number[]
    };

    const f  = (sz: number, st = 'normal') => { doc.setFont('helvetica', st); doc.setFontSize(sz); };
    const tc = (c: number[]) => doc.setTextColor(c[0], c[1], c[2]);
    const dc = (c: number[]) => doc.setDrawColor(c[0], c[1], c[2]);
    const fc = (c: number[]) => doc.setFillColor(c[0], c[1], c[2]);

    // per-column page/cursor state — left and right columns can land on
    // different physical pages once either one runs past the page bottom
    type Col = { page: number; y: number };
    const newCol = (startY: number): Col => ({ page: 1, y: startY });

    function ensure(col: Col, need: number) {
      if (col.y + need > SAFE_BOT) {
        doc.addPage();
        col.page = doc.getNumberOfPages();
        col.y = TOP;
      }
      doc.setPage(col.page);
    }

    function sectionHead(col: Col, x: number, t: string, w: number) {
      ensure(col, 24);
      f(10, 'bold'); tc(C.bk);
      doc.text(t, x, col.y);
      dc(C.bk); doc.setLineWidth(0.7);
      doc.line(x, col.y + 4, x + w, col.y + 4);
      col.y += 17;
    }

    function dashedDivider(col: Col, x: number, w: number) {
      const before = col.y;
      ensure(col, 10);
      if (col.y === TOP && before !== TOP) return; // just paged — skip an orphaned divider at the top
      dc(C.ln); doc.setLineWidth(0.6);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(x, col.y, x + w, col.y);
      doc.setLineDashPattern([], 0);
    }

    function dot(x: number, yy: number, color: number[]) {
      fc(color); doc.circle(x + 1.2, yy - 2.6, 1.2, 'F');
    }

    // renders "date  location" with small dot markers on the current line
    function metaRow(col: Col, x: number, dateText: string, locText: string | undefined, color: number[]) {
      ensure(col, 10);
      f(7.5, 'normal'); tc(color);
      let cx = x;
      dot(cx, col.y, color); cx += 6;
      doc.text(dateText, cx, col.y);
      cx += doc.getTextWidth(dateText) + 12;
      if (locText) {
        dot(cx, col.y, color); cx += 6;
        doc.text(locText, cx, col.y);
      }
    }

    function parseBold(text: string): { t: string; b: boolean }[] {
      const out: { t: string; b: boolean }[] = [];
      const re = /\*\*(.+?)\*\*/g;
      let last = 0, m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        if (m.index > last) out.push({ t: text.slice(last, m.index), b: false });
        out.push({ t: m[1], b: true });
        last = m.index + m[0].length;
      }
      if (last < text.length) out.push({ t: text.slice(last), b: false });
      return out;
    }

    // groups text into whitespace-delimited "words", each word being one or more
    // {t, b} runs — a word only gets split into multiple runs when a **bold**
    // boundary falls mid-word with no surrounding space (e.g. "**portal**: next"),
    // so runs within a word render back-to-back with no inserted gap
    function tokenize(text: string): { t: string; b: boolean }[][] {
      const words: { t: string; b: boolean }[][] = [];
      let current: { t: string; b: boolean }[] = [];
      parseBold(text).forEach(seg => {
        seg.t.split(/(\s+)/).forEach(part => {
          if (part === '') return;
          if (/^\s+$/.test(part)) {
            if (current.length) { words.push(current); current = []; }
          } else {
            current.push({ t: part, b: seg.b });
          }
        });
      });
      if (current.length) words.push(current);
      return words;
    }

    // wraps + renders mixed bold/normal text starting at col.y, paging per line as needed
    function richWrap(col: Col, x: number, w: number, text: string, size: number, lineH: number, color: number[]) {
      const words = tokenize(text);
      f(size, 'normal');
      const spaceW = doc.getTextWidth(' ');
      const wordWidths = words.map(word =>
        word.reduce((s, run) => { f(size, run.b ? 'bold' : 'normal'); return s + doc.getTextWidth(run.t); }, 0));

      const lines: number[][] = [[]];
      let lineW = 0;
      words.forEach((_, wi) => {
        const ww = wordWidths[wi];
        if (lineW + ww > w && lines[lines.length - 1].length > 0) { lines.push([]); lineW = 0; }
        lines[lines.length - 1].push(wi);
        lineW += ww + spaceW;
      });

      lines.forEach(lineIdxs => {
        ensure(col, lineH);
        let cx = x;
        lineIdxs.forEach(wi => {
          words[wi].forEach(run => {
            f(size, run.b ? 'bold' : 'normal'); tc(color);
            doc.text(run.t, cx, col.y);
            cx += doc.getTextWidth(run.t);
          });
          cx += spaceW;
        });
        col.y += lineH;
      });
    }

    // bullet dot + hanging-indent rich text
    function richBullet(col: Col, x: number, w: number, text: string, size: number, lineH: number, color: number[]) {
      ensure(col, lineH);
      dot(x, col.y - (size * 0.32) + 2.6, color);
      richWrap(col, x + 9, w - 9, text, size, lineH, color);
    }

    // wraps + renders plain (non-bold) text, paging per line as needed
    function plainWrap(col: Col, x: number, w: number, text: string, size: number, style: string, lineH: number, color: number[]) {
      f(size, style); tc(color);
      doc.splitTextToSize(text, w).forEach((l: string) => {
        ensure(col, lineH);
        f(size, style); tc(color);
        doc.text(l, x, col.y);
        col.y += lineH;
      });
    }

    // ── HEADER (always page 1) ───────────────────────────────────────────
    doc.setPage(1);
    let y = 32;
    f(19, 'bold'); tc(C.bk);
    doc.text(data.personalInfo.name.toUpperCase(), M, y);

    y += 16;
    f(11, 'bold'); tc(C.bl);
    doc.text(data.personalInfo.title, M, y);

    y += 15;
    const p = data.personalInfo;
    type CPart = { text: string; url: string | null; link: boolean };
    const cparts: CPart[] = [];
    if (p.phone)    cparts.push({ text: p.phone, url: null, link: false });
    if (p.email)    cparts.push({ text: p.email, url: 'mailto:' + p.email, link: true });
    if (p.linkedin) cparts.push({ text: p.linkedin.replace(/^https?:\/\//, ''), url: p.linkedin, link: true });
    if (p.github)   cparts.push({ text: p.github.replace(/^https?:\/\//, ''), url: p.github, link: true });
    if (p.location) cparts.push({ text: p.location, url: null, link: false });

    f(8, 'normal');
    let cx = M;
    cparts.forEach(pt => {
      dot(cx, y, C.gy); cx += 7;
      if (pt.link) { tc(C.bl); doc.textWithLink(pt.text, cx, y, { url: pt.url! }); }
      else         { tc(C.md); doc.text(pt.text, cx, y); }
      cx += doc.getTextWidth(pt.text) + 14;
    });

    y += 26;

    // ── TWO COLUMNS ───────────────────────────────────────────────────────
    const colGap = 20;
    const leftW = Math.round(cw * 0.65);
    const rightW = cw - leftW - colGap;
    const leftX = M, rightX = M + leftW + colGap;
    const colL = newCol(y);
    const colR = newCol(y);

    // LEFT: SUMMARY
    sectionHead(colL, leftX, 'SUMMARY', leftW);
    richWrap(colL, leftX, leftW, data.summary, 8, 10.6, C.dk);
    colL.y += 10;

    // LEFT: EXPERIENCE
    sectionHead(colL, leftX, 'EXPERIENCE', leftW);
    data.experiences.forEach((exp, ei) => {
      if (ei > 0) { dashedDivider(colL, leftX, leftW); colL.y += 12; }

      ensure(colL, 12);
      f(10.5, 'bold'); tc(C.bk);
      doc.text(exp.role, leftX, colL.y); colL.y += 12;

      ensure(colL, 11);
      f(9.5, 'bold'); tc(C.bl);
      doc.text(exp.company, leftX, colL.y); colL.y += 11;

      metaRow(colL, leftX, exp.dateRange, p.location, C.gy);
      colL.y += 11;

      if (exp.subtitle) {
        plainWrap(colL, leftX, leftW, exp.subtitle, 7.5, 'italic', 9.9, C.gy);
        colL.y += 3;
      }

      exp.subsections.forEach(ss => ss.bullets.forEach(b => richBullet(colL, leftX, leftW, b, 7.7, 10.1, C.dk)));
      colL.y += 4;
    });

    // LEFT: PROJECTS
    if (data.projects.length) {
      colL.y += 5;
      sectionHead(colL, leftX, 'PROJECTS', leftW);
      data.projects.forEach((proj, pi) => {
        ensure(colL, 10.5);
        f(9.2, 'bold'); tc(C.bk);
        doc.text(proj.name, leftX, colL.y); colL.y += 10.5;

        if (proj.githubText) {
          ensure(colL, 10);
          f(7.3, proj.githubUrl ? 'normal' : 'italic');
          if (proj.githubUrl) { tc(C.bl); doc.textWithLink(proj.githubText, leftX, colL.y, { url: proj.githubUrl }); }
          else                { tc(C.gy); doc.text(proj.githubText, leftX, colL.y); }
          colL.y += 10;
        }
        if (proj.description) {
          richWrap(colL, leftX, leftW, proj.description, 7.7, 10, C.md);
        }
        if (pi < data.projects.length - 1) {
          colL.y += 3;
          dashedDivider(colL, leftX, leftW);
          colL.y += 7;
        }
      });
    }

    // RIGHT: KEY ACHIEVEMENTS
    const keyAchievements = data.keyAchievements ?? [];
    if (keyAchievements.length) {
      sectionHead(colR, rightX, 'KEY ACHIEVEMENTS', rightW);
      keyAchievements.forEach((ka, i) => {
        plainWrap(colR, rightX, rightW, ka.title, 9, 'bold', 11, C.bk);
        colR.y += 2;
        richWrap(colR, rightX, rightW, ka.description, 7.8, 10.4, C.dk);
        if (i < keyAchievements.length - 1) {
          colR.y += 5;
          dashedDivider(colR, rightX, rightW);
          colR.y += 10;
        } else {
          colR.y += 12;
        }
      });
    }

    // RIGHT: SKILLS
    sectionHead(colR, rightX, 'SKILLS', rightW);
    data.skills.forEach((s, i) => {
      ensure(colR, 11);
      f(8.3, 'bold'); tc(C.bl);
      doc.text(s.label.replace(/:\s*$/, ''), rightX, colR.y);
      colR.y += 11;
      plainWrap(colR, rightX, rightW, s.value, 7.8, 'normal', 10.4, C.dk);
      if (i < data.skills.length - 1) {
        colR.y += 4;
        dashedDivider(colR, rightX, rightW);
        colR.y += 9;
      } else {
        colR.y += 12;
      }
    });

    // RIGHT: EDUCATION
    sectionHead(colR, rightX, 'EDUCATION', rightW);
    const edu = data.education;
    const eduLine = edu.degree + (edu.cgpa ? '  |  CGPA: ' + edu.cgpa : '');
    plainWrap(colR, rightX, rightW, eduLine, 9, 'bold', 11, C.bk);
    plainWrap(colR, rightX, rightW, edu.institution, 8.3, 'bold', 10.5, C.bl);
    metaRow(colR, rightX, edu.year, edu.location, C.gy);

    if (watermark) {
      this.stampWatermark(doc, watermark, W, PAGE_H);
    }

    doc.save(data.personalInfo.name.replace(/\s+/g, '_') + '_Modern_Resume.pdf');
  }
}
