import { Injectable } from '@angular/core';
import { ResumeData } from '../models/resume.model';

@Injectable({ providedIn: 'root' })
export class DocGeneratorService {

  /** Simple Word-compatible export (HTML wrapped in Word markup) — used for sample/preview downloads. */
  generate(data: ResumeData, watermark?: string): void {
    const esc = (s: string | undefined) => (s ?? '').replace(/\*\*/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const watermarkBanner = watermark
      ? `<p style="text-align:center;color:#b0b0b0;font-weight:bold;font-size:11pt;letter-spacing:2px;">${esc(watermark)}</p>`
      : '';

    const contactParts = [data.personalInfo.phone, data.personalInfo.email, data.personalInfo.linkedin, data.personalInfo.github, data.personalInfo.location]
      .filter(Boolean).map(esc).join(' &nbsp;|&nbsp; ');

    const experienceHtml = data.experiences.map(exp => `
      <h3 style="margin-bottom:2px;">${esc(exp.company)} — ${esc(exp.role)} <span style="font-weight:normal;color:#666;font-size:10pt;">(${esc(exp.dateRange)})</span></h3>
      ${exp.subtitle ? `<p style="font-style:italic;color:#666;margin-top:0;">${esc(exp.subtitle)}</p>` : ''}
      ${exp.subsections.map(ss => `<ul>${ss.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`).join('')}
    `).join('');

    const projectsHtml = data.projects.map(proj => `
      <p style="margin-bottom:0;"><b>${esc(proj.name)}</b>${proj.description ? ' — ' + esc(proj.description) : ''}</p>
      ${proj.githubText ? `<p style="margin-top:0;color:#888;font-size:9.5pt;">${esc(proj.githubText)}</p>` : ''}
    `).join('');

    const skillsHtml = data.skills.map(s => `<p><b>${esc(s.label)}</b>${esc(s.value)}</p>`).join('');
    const achievementsHtml = `<ul>${data.achievements.map(a => `<li>${esc(a)}</li>`).join('')}</ul>`;
    const edu = data.education;

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>${esc(data.personalInfo.name)} Resume</title></head>
      <body style="font-family:Calibri, Arial, sans-serif; font-size:11pt; color:#222;">
        ${watermarkBanner}
        <h1 style="text-align:center;margin-bottom:0;">${esc(data.personalInfo.name)}</h1>
        <p style="text-align:center;color:#1a5fb4;font-weight:bold;margin-top:2px;">${esc(data.personalInfo.title)}</p>
        <p style="text-align:center;color:#666;font-size:10pt;">${contactParts}</p>
        <hr>
        <h2>Professional Summary</h2>
        <p>${esc(data.summary)}</p>
        <h2>Work Experience</h2>
        ${experienceHtml}
        <h2>Projects</h2>
        ${projectsHtml}
        <h2>Skills</h2>
        ${skillsHtml}
        <h2>Education</h2>
        <p><b>${esc(edu.degree)}</b> — ${esc(edu.institution)} | ${esc(edu.year)} | CGPA: ${esc(edu.cgpa)}</p>
        <h2>Achievements</h2>
        ${achievementsHtml}
        ${watermarkBanner}
      </body>
      </html>
    `;

    const blob = new Blob(['﻿', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.personalInfo.name.replace(/\s+/g, '_') + '_Resume.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
