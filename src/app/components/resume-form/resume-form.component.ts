import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { UsageService } from '../../services/usage.service';
import { AuthService } from '../../services/auth.service';
import { ResumeData } from '../../models/resume.model';
import { SiteHeaderComponent } from '../shared/site-header/site-header.component';
import { SiteFooterComponent } from '../shared/site-footer/site-footer.component';
import { sampleFrontend, sampleBackend } from '../../data/sample-resumes';

const OWNER_EMAIL = 'ankajkuray@gmail.com';

type ProfileKey = 'frontend' | 'backend';

interface ExperienceProfile {
  company: string;
  role: string;
  dateRange: string;
  subtitle: string;
  subsections: { title: string; bullets: string[] }[];
}

interface ResumeProfile {
  title: string;
  summary: string;
  experience: ExperienceProfile;
  projects: { name: string; description: string; githubUrl: string; githubText: string }[];
  skills: { label: string; value: string }[];
  achievements: string[];
  keyAchievements: { title: string; description: string }[];
}

@Component({
  selector: 'app-resume-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SiteHeaderComponent, SiteFooterComponent],
  templateUrl: './resume-form.component.html',
  styleUrl: './resume-form.component.css'
})
export class ResumeFormComponent {
  form: FormGroup;
  message = '';
  messageType = '';
  activeProfile: ProfileKey = 'frontend';
  templateStyle: 'classic' | 'modern' = 'classic';
  keyAchievements: { title: string; description: string }[] = [];

  private readonly isOwner: boolean;

  constructor(
    private fb: FormBuilder,
    private pdfService: PdfGeneratorService,
    private usageService: UsageService,
    private auth: AuthService
  ) {
    this.form = this.buildForm();

    this.isOwner = (this.auth.session()?.user.email ?? '').toLowerCase() === OWNER_EMAIL;

    if (this.isOwner) {
      this.form.patchValue({
        personalInfo: {
          name: 'Ankaj Kumar',
          phone: '+91-9064748813',
          email: 'ankajkuray@gmail.com',
          linkedin: 'https://www.linkedin.com/in/ankaj-ray',
          github: 'https://github.com/akroy',
          leetcode: 'https://leetcode.com/ankajarya275',
          location: 'Bengaluru, India'
        },
        education: {
          degree: 'Bachelor of Engineering',
          institution: 'University Institute of Technology, Burdwan',
          year: '2022',
          cgpa: '7.85/10',
          location: 'Burdwan, West Bengal, India'
        }
      });
    } else {
      // Any other account gets generic placeholder data instead of the owner's real details.
      this.form.patchValue({
        personalInfo: { ...sampleFrontend.personalInfo },
        education: { ...sampleFrontend.education }
      });
    }

    this.applyProfile('frontend');
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      personalInfo: this.fb.group({
        name: ['', Validators.required],
        title: ['', Validators.required],
        phone: [''],
        email: ['', [Validators.required, Validators.email]],
        linkedin: [''],
        github: [''],
        leetcode: [''],
        location: ['']
      }),
      summary: ['', Validators.required],
      experiences: this.fb.array([]),
      projects: this.fb.array([]),
      skills: this.fb.array([]),
      education: this.fb.group({
        degree: [''],
        institution: [''],
        year: [''],
        cgpa: [''],
        location: ['']
      }),
      achievements: this.fb.array([])
    });
  }

  // ===== Getters =====
  get experiences(): FormArray { return this.form.get('experiences') as FormArray; }
  get projects(): FormArray { return this.form.get('projects') as FormArray; }
  get skills(): FormArray { return this.form.get('skills') as FormArray; }
  get achievements(): FormArray { return this.form.get('achievements') as FormArray; }

  getSubsections(expIndex: number): FormArray {
    return this.experiences.at(expIndex).get('subsections') as FormArray;
  }

  getBullets(expIndex: number, ssIndex: number): FormArray {
    return this.getSubsections(expIndex).at(ssIndex).get('bullets') as FormArray;
  }

  // ===== Add/Remove =====
  addExperience() {
    this.experiences.push(this.fb.group({
      company: [''],
      role: [''],
      dateRange: [''],
      subtitle: [''],
      subsections: this.fb.array([])
    }));
  }

  removeExperience(i: number) { this.experiences.removeAt(i); }

  addSubsection(expIndex: number) {
    this.getSubsections(expIndex).push(this.fb.group({
      title: [''],
      bullets: this.fb.array([this.fb.control('')])
    }));
  }

  removeSubsection(expIndex: number, ssIndex: number) {
    this.getSubsections(expIndex).removeAt(ssIndex);
  }

  addBullet(expIndex: number, ssIndex: number) {
    this.getBullets(expIndex, ssIndex).push(this.fb.control(''));
  }

  removeBullet(expIndex: number, ssIndex: number, bIndex: number) {
    this.getBullets(expIndex, ssIndex).removeAt(bIndex);
  }

  addProject() {
    this.projects.push(this.fb.group({
      name: [''],
      description: [''],
      githubUrl: [''],
      githubText: ['']
    }));
  }

  removeProject(i: number) { this.projects.removeAt(i); }

  addSkill() {
    this.skills.push(this.fb.group({
      label: [''],
      value: ['']
    }));
  }

  removeSkill(i: number) { this.skills.removeAt(i); }

  addAchievement() {
    this.achievements.push(this.fb.control(''));
  }

  removeAchievement(i: number) { this.achievements.removeAt(i); }

  // ===== Generate PDF =====
  generatePdf() {
    if (this.form.invalid) {
      this.message = 'Please fill in all required fields (Name, Title, Email, Summary).';
      this.messageType = 'error';
      this.form.markAllAsTouched();
      return;
    }

    const data: ResumeData = this.form.value;
    if (this.templateStyle === 'modern') {
      this.pdfService.generateModern({ ...data, keyAchievements: this.keyAchievements });
    } else {
      this.pdfService.generate(data);
    }
    this.usageService.recordGeneration(this.activeProfile, this.templateStyle);
    this.message = 'PDF Downloaded! All links are clickable.';
    this.messageType = 'success';
  }

  toggleTemplateStyle(style: 'classic' | 'modern') {
    this.templateStyle = style;
  }

  clearForm() {
    this.clearArrays();
    this.form.reset();
    this.message = '';
  }

  // ===== Profile switching =====
  switchProfile(profile: ProfileKey) {
    if (profile === this.activeProfile) return;
    this.applyProfile(profile);
    this.message = '';
  }

  private clearArrays() {
    while (this.experiences.length) this.experiences.removeAt(0);
    while (this.projects.length) this.projects.removeAt(0);
    while (this.skills.length) this.skills.removeAt(0);
    while (this.achievements.length) this.achievements.removeAt(0);
  }

  private fillExperienceSubsections(expIndex: number, subsections: { title: string; bullets: string[] }[]) {
    subsections.forEach((ssData, ssIdx) => {
      this.addSubsection(expIndex);
      this.getSubsections(expIndex).at(ssIdx).patchValue({ title: ssData.title });
      const bulletsArr = this.getBullets(expIndex, ssIdx);
      bulletsArr.at(0).setValue(ssData.bullets[0]);
      for (let i = 1; i < ssData.bullets.length; i++) {
        bulletsArr.push(this.fb.control(ssData.bullets[i]));
      }
    });
  }

  private applyProfile(profile: ProfileKey) {
    this.activeProfile = profile;
    this.clearArrays();

    const data = this.isOwner
      ? (profile === 'frontend' ? this.frontendProfile : this.backendProfile)
      : (profile === 'frontend' ? this.genericFrontendProfile : this.genericBackendProfile);

    this.form.patchValue({
      personalInfo: { title: data.title },
      summary: data.summary
    });

    this.addExperience();
    this.experiences.at(0).patchValue({
      company: data.experience.company,
      role: data.experience.role,
      dateRange: data.experience.dateRange,
      subtitle: data.experience.subtitle
    });
    this.fillExperienceSubsections(0, data.experience.subsections);

    data.projects.forEach(proj => {
      this.addProject();
      this.projects.at(this.projects.length - 1).patchValue(proj);
    });

    data.skills.forEach(skill => {
      this.addSkill();
      this.skills.at(this.skills.length - 1).patchValue(skill);
    });

    data.achievements.forEach(a => {
      this.addAchievement();
      this.achievements.at(this.achievements.length - 1).setValue(a);
    });

    this.keyAchievements = data.keyAchievements;
  }

  // ===== Generic placeholder profiles (used for any non-owner account) =====
  private readonly genericFrontendProfile: ResumeProfile = {
    title: sampleFrontend.personalInfo.title,
    summary: sampleFrontend.summary,
    experience: sampleFrontend.experiences[0],
    projects: sampleFrontend.projects,
    skills: sampleFrontend.skills,
    achievements: sampleFrontend.achievements,
    keyAchievements: sampleFrontend.keyAchievements ?? []
  };

  private readonly genericBackendProfile: ResumeProfile = {
    title: sampleBackend.personalInfo.title,
    summary: sampleBackend.summary,
    experience: sampleBackend.experiences[0],
    projects: sampleBackend.projects,
    skills: sampleBackend.skills,
    achievements: sampleBackend.achievements,
    keyAchievements: sampleBackend.keyAchievements ?? []
  };

  // ===== Frontend-centric profile (Angular / UI focus) — owner only =====
  private readonly frontendProfile: ResumeProfile = {
    title: 'Software Engineer',
    summary: 'Software Engineer with **4+ years** at InCred Financial Services, currently owning 2 active production portals (Ops Portal and File Tracker FE) using **Angular 18** and **RxJS**. Architected the **auth-login npm package**, providing SSO, OTP login, and access/refresh token management, **migrating 15+ portals from Auth0** and **eliminating 100% of enterprise licensing costs**. Expert in Angular 18, TypeScript, JavaScript (ES6+), RxJS, NestJS, Keycloak/OAuth 2.0, RBAC, CI/CD, and Agile/Scrum.',
    experience: {
      company: 'InCred Financial Services',
      role: 'Software Engineer',
      dateRange: 'Aug 2022 - Present',
      subtitle: 'Currently owns Ops Portal and FTS; built org-wide auth-login npm package (15+ portals migrated from Auth0), UAM, SCF Connector, 150+ users',
      subsections: [
        {
          title: 'Frontend Development and Architecture',
          bullets: [
            '**Architect and own** InCred Ops Portal and File Tracker (FTS) FE end-to-end - Angular 18 standalone components, lazy loading, RxJS, SCSS, PrimeNG - serving **150+ users** across 4 loan processing teams.',
            '**Engineered scalable Angular project structures** with CI/CD pipelines, hash-based routing, and functional route guards - **zero-downtime deployments** across 4 environments with **100% page-level access control**.',
            '**Delivered 6+ fintech portals** (Ops Portal, File Tracker, SCF Connector Onboarding, UAM, Admin Portal, Report Portal) collaborating with 4+ cross-functional product teams in Agile/Scrum sprints.',
            '**Established reusable Angular component libraries** and architecture standards adopted across 5+ engineering teams - reducing new portal setup time by **up to 40%**.'
          ]
        },
        {
          title: 'Authentication, Authorization and Access Control',
          bullets: [
            '**Designed and published the auth-login npm package** (incred-engineers/auth-login), a framework-agnostic UMD package (Webpack 5) providing OTP login, SSO, OAuth 2.0, and Keycloak-integrated token management - **migrating 15+ portals from Auth0** and **eliminating 100% of licensing costs**.',
            '**Built and owned the User Access Management (UAM) portal**: defined RBAC model, Angular 18 frontend, Keycloak integration, and audit logs managing **150+ users** across 3 environments.',
            '**Implemented role-based route guards**, permission-driven UI rendering, and admin dashboards for user/role/group management - enforcing **100% RBAC compliance** across all InCred internal applications.'
          ]
        },
        {
          title: 'BFF Services and Full-Stack Contributions',
          bullets: [
            '**Designed and maintained OPS and FTS backend services** (NestJS 11, TypeScript) orchestrating microservices (Hermes, Document Service, UAM) with JWT middleware, Swagger/OpenAPI, and DTO validation.',
            '**Developed and enhanced Admin Portal, Report Portal, and Keycloak configuration** - spanning Angular frontends, NestJS services, and identity infrastructure across multiple product teams.'
          ]
        }
      ]
    },
    projects: [
      {
        name: 'InCred Ops Portal',
        description: 'Owner and Architect (FE), Angular 18, SCSS, RxJS, PrimeNG, BFF, 150+ users, currently active',
        githubUrl: '',
        githubText: 'github.com/Incred-Engineers/incred-ops-portal — Private, available on request'
      },
      {
        name: 'InCred File Tracker (FTS)',
        description: 'Owner and Architect (FE), Angular 18, SCSS, RxJS, TypeScript, concept to production, currently active',
        githubUrl: '',
        githubText: 'github.com/Incred-Engineers/incred-dms-fe — Private, available on request'
      },
      {
        name: 'auth-login npm package (incred-engineers)',
        description: 'Owner and Architect, Webpack 5, UMD, Keycloak, SSO, OTP, OAuth 2.0, 15+ portals migrated from Auth0, 100% licensing cost eliminated',
        githubUrl: '',
        githubText: 'github.com/Incred-Engineers/auth-login — Private, available on request'
      },
      {
        name: 'User Access Management (UAM)',
        description: 'Owner, End-to-End, Angular 18, RBAC, Keycloak, Audit Logs, 150+ users managed, 100% audit coverage',
        githubUrl: '',
        githubText: 'github.com/Incred-Engineers/user-access-management — Private, available on request'
      },
      {
        name: 'SCF Connector Onboarding',
        description: 'Owner (FE), Angular 18, TypeScript, Supply Chain Finance workflows, concept to production',
        githubUrl: '',
        githubText: 'Internal Repository — Private, available on request'
      },
      {
        name: 'OPS BFF and FTS BFF',
        description: 'Owner and Developer, NestJS 11, TypeScript, REST API, Swagger/OpenAPI, JWT, microservices orchestration',
        githubUrl: '',
        githubText: 'github.com/Incred-Engineers/bff-ops — Private, available on request'
      }
    ],
    skills: [
      { label: 'Languages: ', value: 'JavaScript (ES6+), TypeScript, HTML5, CSS3, SCSS/Sass, SQL, Python, Java, C++' },
      { label: 'Frameworks & Libraries: ', value: 'Angular 18, React, Node.js, NestJS, RxJS, PrimeNG, Bootstrap, Webpack 5' },
      { label: 'Architecture & Patterns: ', value: 'SPA, BFF, Standalone Components, Lazy Loading, RBAC, Interceptor Pattern, REST API, Microservices, Agile/Scrum' },
      { label: 'Auth & Security: ', value: 'Keycloak, SSO, OAuth 2.0, OTP, JWT, RBAC, API Gateway, npm Package Development' },
      { label: 'Testing & Tools: ', value: 'Karma, Jasmine, Jest, Git, GitHub, CI/CD, Swagger/OpenAPI, MySQL, JIRA, Code Review' },
      { label: 'Soft Skills: ', value: 'Technical Leadership, Cross-Team Collaboration, Mentoring, Problem-Solving, Communication, Agile Delivery' }
    ],
    achievements: [
      'Migrated 15+ enterprise portals from Auth0 to the auth-login npm package (in-house UMD auth library with SSO, OTP, access/refresh tokens) - eliminating 100% of annual licensing costs organization-wide.',
      'Solved 500+ DSA problems (LeetCode, GFG, CodeChef); Global Rank 440 out of 10,000+ in Newton Coding Contest (Apr 2022).',
      'Active contributor via internal tech talks, hackathons, and cross-team code reviews - driving engineering best practices at InCred.'
    ],
    keyAchievements: [
      {
        title: 'Auth0 Migration & Licensing Cost Elimination',
        description: '**Migrated 15+ enterprise portals** from Auth0 to the in-house auth-login npm package (SSO, OTP, access/refresh tokens), **eliminating 100% of annual licensing costs** organization-wide.'
      },
      {
        title: 'Competitive Programming',
        description: '**Solved 500+ DSA problems** (LeetCode, GFG, CodeChef); **Global Rank 440** out of 10,000+ in Newton Coding Contest (Apr 2022).'
      },
      {
        title: 'Engineering Community Contributor',
        description: 'Active contributor via internal tech talks, hackathons, and cross-team code reviews - driving **engineering best practices** at InCred.'
      }
    ]
  };

  // ===== Backend / full-stack (Node.js) centric profile =====
  private readonly backendProfile: ResumeProfile = {
    title: 'Full-Stack Engineer (Node.js / Backend)',
    summary: 'Full-Stack Software Engineer with **4+ years** at InCred Financial Services, specializing in **Node.js/NestJS** backend architecture. Own the OPS and FTS **BFF services** orchestrating microservices with **JWT auth** and Swagger/OpenAPI. Architected the **auth-login npm package** delivering SSO, OTP, and OAuth 2.0/Keycloak token management, **migrating 15+ portals off Auth0** and **eliminating 100% of licensing costs**. Skilled in Node.js, NestJS, TypeScript, REST APIs, microservices, RBAC, CI/CD, and Angular.',
    experience: {
      company: 'InCred Financial Services',
      role: 'Software Engineer (Full-Stack / Backend)',
      dateRange: 'Aug 2022 - Present',
      subtitle: 'Owns OPS & FTS backend services (NestJS) and org-wide auth-login npm package; backend architecture for 6+ fintech portals serving 150+ users',
      subsections: [
        {
          title: 'Backend Architecture & BFF Services',
          bullets: [
            '**Designed and maintained the OPS and FTS BFF services** in NestJS 11 and TypeScript, orchestrating microservices (Hermes, Document Service, UAM) with JWT middleware, Swagger/OpenAPI docs, and DTO validation.',
            '**Built and exposed RESTful APIs** powering 6+ fintech portals (Ops Portal, File Tracker, SCF Connector, UAM, Admin Portal, Report Portal), handling request orchestration and response shaping for **150+ daily users**.',
            '**Implemented centralized JWT-based authentication middleware** and role-guarded API endpoints, enforcing **100% RBAC compliance** at the service layer across all InCred internal applications.',
            '**Established Node.js/NestJS service architecture standards** - modular structure, DTO validation, layered interceptors - adopted across 5+ teams, cutting new service bootstrap time by **up to 40%**.'
          ]
        },
        {
          title: 'Authentication, Authorization and Identity Systems',
          bullets: [
            '**Designed and published the auth-login npm package** (incred-engineers/auth-login), a Node.js/Webpack 5 UMD package providing OTP login, SSO, OAuth 2.0, and Keycloak-integrated token management - **migrating 15+ portals off Auth0** and **eliminating 100% of licensing costs**.',
            '**Built and owned the User Access Management (UAM) service**: RBAC data model, Keycloak integration, and audit-log persistence via backend APIs, managing **150+ users** across 3 environments.',
            '**Implemented token-refresh flows**, session/permission middleware, and audit logging at the API layer, enforcing role-based access control across all internal services.'
          ]
        },
        {
          title: 'Full-Stack Delivery & DevOps',
          bullets: [
            '**Delivered features end-to-end** across Angular 18 frontends and NestJS backends for **6+ fintech portals**, collaborating with 4+ product teams in Agile/Scrum sprints.',
            '**Engineered CI/CD pipelines** (dev, QA, UAT, prod) for frontend and backend services, achieving **zero-downtime deployments** across 4 environments.'
          ]
        }
      ]
    },
    projects: [
      {
        name: 'OPS BFF and FTS BFF',
        description: 'Owner and Architect, NestJS 11, TypeScript, REST API, Swagger/OpenAPI, JWT, microservices orchestration, 150+ users',
        githubUrl: '',
        githubText: 'github.com/Incred-Engineers/bff-ops — Private, available on request'
      },
      {
        name: 'auth-login npm package (incred-engineers)',
        description: 'Owner and Architect, Node.js, Webpack 5, UMD, Keycloak, SSO, OTP, OAuth 2.0, 15+ portals migrated from Auth0, 100% licensing cost eliminated',
        githubUrl: '',
        githubText: 'github.com/Incred-Engineers/auth-login — Private, available on request'
      },
      {
        name: 'User Access Management (UAM)',
        description: 'Owner, Backend RBAC service + Angular frontend, Keycloak, Audit Logs, 150+ users managed, 100% audit coverage',
        githubUrl: '',
        githubText: 'github.com/Incred-Engineers/user-access-management — Private, available on request'
      },
      {
        name: 'InCred Ops Portal',
        description: 'Full-Stack Owner (BFF + FE), NestJS, Angular 18, RxJS, PrimeNG, 150+ users, currently active',
        githubUrl: '',
        githubText: 'github.com/Incred-Engineers/incred-ops-portal — Private, available on request'
      },
      {
        name: 'InCred File Tracker (FTS)',
        description: 'Full-Stack Owner, NestJS backend + Angular 18 FE, concept to production, currently active',
        githubUrl: '',
        githubText: 'github.com/Incred-Engineers/incred-dms-fe — Private, available on request'
      },
      {
        name: 'SCF Connector Onboarding',
        description: 'Full-Stack Owner, Node.js/Angular, Supply Chain Finance workflows, concept to production',
        githubUrl: '',
        githubText: 'Internal Repository — Private, available on request'
      }
    ],
    skills: [
      { label: 'Languages: ', value: 'JavaScript (ES6+), TypeScript, SQL, Python, Java, C++, HTML5, CSS3' },
      { label: 'Backend & Runtime: ', value: 'Node.js, NestJS 11, REST API Design, Microservices, BFF Architecture, JWT, DTO Validation, Swagger/OpenAPI' },
      { label: 'Auth & Security: ', value: 'Keycloak, OAuth 2.0, SSO, OTP, JWT, RBAC, API Gateway, npm Package Development' },
      { label: 'Databases & Tools: ', value: 'MySQL, Git, GitHub, CI/CD, Jest, Karma, Jasmine, JIRA, Code Review' },
      { label: 'Frontend (Full-Stack context): ', value: 'Angular 18, RxJS, PrimeNG, Bootstrap, Webpack 5' },
      { label: 'Soft Skills: ', value: 'Technical Leadership, Cross-Team Collaboration, Mentoring, Problem-Solving, Communication, Agile Delivery' }
    ],
    achievements: [
      'Migrated 15+ enterprise portals from Auth0 to the auth-login npm package (in-house Node.js/UMD auth library with SSO, OTP, access/refresh tokens) - eliminating 100% of annual licensing costs organization-wide.',
      'Solved 500+ DSA problems (LeetCode, GFG, CodeChef); Global Rank 440 out of 10,000+ in Newton Coding Contest (Apr 2022).',
      'Active contributor via internal tech talks, hackathons, and cross-team code reviews - driving backend engineering best practices at InCred.'
    ],
    keyAchievements: [
      {
        title: 'Auth0 Migration & Licensing Cost Elimination',
        description: '**Migrated 15+ enterprise portals** from Auth0 to the in-house Node.js/UMD auth-login package (SSO, OTP, access/refresh tokens), **eliminating 100% of annual licensing costs** organization-wide.'
      },
      {
        title: 'Competitive Programming',
        description: '**Solved 500+ DSA problems** (LeetCode, GFG, CodeChef); **Global Rank 440** out of 10,000+ in Newton Coding Contest (Apr 2022).'
      },
      {
        title: 'Engineering Community Contributor',
        description: 'Active contributor via internal tech talks, hackathons, and cross-team code reviews - driving **backend engineering best practices** at InCred.'
      }
    ]
  };
}
