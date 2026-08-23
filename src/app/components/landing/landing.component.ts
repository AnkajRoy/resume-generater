import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { DocGeneratorService } from '../../services/doc-generator.service';
import { AuthService } from '../../services/auth.service';
import { sampleFrontend, sampleBackend } from '../../data/sample-resumes';
import { ResumeData } from '../../models/resume.model';

const WATERMARK = 'ankajk-resume-gene-org — SAMPLE';

type CardKey = 'classic-fe' | 'classic-be' | 'modern-fe' | 'modern-be';

interface MiniSection {
  heading: string;
  widths: ('w90' | 'w80' | 'w65')[];
}

interface ShowcaseCard {
  key: CardKey;
  name: string;
  tagline: string;
  previewClass: 'classic' | 'modern';
  layout: 'Classic' | 'Modern';
  roleLabel: string;
  data: ResumeData;
  sections: MiniSection[];
}

const CLASSIC_SECTIONS: MiniSection[] = [
  { heading: 'Professional Summary', widths: ['w90', 'w90', 'w65'] },
  { heading: 'Work Experience', widths: ['w90', 'w80', 'w90', 'w65'] },
  { heading: 'Skills', widths: ['w90', 'w80'] },
  { heading: 'Education', widths: ['w80'] }
];

const MODERN_SECTIONS: MiniSection[] = [
  { heading: 'Summary', widths: ['w90', 'w80'] },
  { heading: 'Experience', widths: ['w90', 'w90', 'w65', 'w80'] },
  { heading: 'Key Achievements', widths: ['w90', 'w80'] },
  { heading: 'Skills', widths: ['w90', 'w65'] }
];

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit {
  activeTab = signal<'all' | 'software'>('all');
  modalCard = signal<ShowcaseCard | null>(null);

  cards: ShowcaseCard[] = [
    {
      key: 'classic-fe',
      name: 'Classic — Frontend',
      tagline: 'Traditional · ATS-First',
      previewClass: 'classic',
      layout: 'Classic',
      roleLabel: 'FRONTEND ENGINEER',
      data: sampleFrontend,
      sections: CLASSIC_SECTIONS
    },
    {
      key: 'classic-be',
      name: 'Classic — Backend / Full-Stack',
      tagline: 'Traditional · Backend-Focused',
      previewClass: 'classic',
      layout: 'Classic',
      roleLabel: 'BACKEND / FULL-STACK ENGINEER',
      data: sampleBackend,
      sections: CLASSIC_SECTIONS
    },
    {
      key: 'modern-fe',
      name: 'Modern — Frontend',
      tagline: 'Two-Column · Contemporary',
      previewClass: 'modern',
      layout: 'Modern',
      roleLabel: 'FRONTEND ENGINEER',
      data: sampleFrontend,
      sections: MODERN_SECTIONS
    },
    {
      key: 'modern-be',
      name: 'Modern — Backend / Full-Stack',
      tagline: 'Two-Column · Backend-Focused',
      previewClass: 'modern',
      layout: 'Modern',
      roleLabel: 'BACKEND / FULL-STACK ENGINEER',
      data: sampleBackend,
      sections: MODERN_SECTIONS
    }
  ];

  constructor(
    private pdfService: PdfGeneratorService,
    private docService: DocGeneratorService,
    private auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    // Covers the email-confirmation redirect: Supabase sends the user back
    // to the Site URL (this landing page) with the session in the URL —
    // if that leaves them already signed in, route them to where they
    // actually belong instead of leaving them stranded on the marketing page.
    await this.auth.ready();
    if (!this.auth.isAuthenticated()) {
      return;
    }
    if (!this.auth.isApproved()) {
      this.router.navigate(['/pending-approval']);
    } else if (!this.auth.hasAccess()) {
      this.router.navigate(['/payment']);
    } else {
      this.router.navigate(['/app']);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  setActiveTab(tab: 'all' | 'software') {
    this.activeTab.set(tab);
  }

  openModal(card: ShowcaseCard) {
    this.modalCard.set(card);
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.modalCard.set(null);
    document.body.style.overflow = '';
  }

  downloadPdf(card: ShowcaseCard, event?: Event) {
    event?.stopPropagation();
    if (card.layout === 'Classic') {
      this.pdfService.generate(card.data, WATERMARK);
    } else {
      this.pdfService.generateModern(card.data, WATERMARK);
    }
  }

  downloadDoc(card: ShowcaseCard, event?: Event) {
    event?.stopPropagation();
    this.docService.generate(card.data, WATERMARK);
  }

  get modalBullets(): string[] {
    const card = this.modalCard();
    if (!card) return [];
    return card.data.experiences[0]?.subsections[0]?.bullets.slice(0, 4).map(b => b.replace(/\*\*/g, '')) ?? [];
  }

  get modalSkillsText(): string {
    const card = this.modalCard();
    if (!card) return '';
    return card.data.skills.slice(0, 3).map(s => s.value).join(' · ');
  }
}
