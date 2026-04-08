import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { ResumeData } from '../../models/resume.model';

@Component({
  selector: 'app-resume-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resume-form.component.html',
  styleUrl: './resume-form.component.css'
})
export class ResumeFormComponent {
  form: FormGroup;
  message = '';
  messageType = '';

  constructor(private fb: FormBuilder, private pdfService: PdfGeneratorService) {
    this.form = this.buildForm();
    this.prefillDefaultData();
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
        leetcode: ['']
      }),
      summary: ['', Validators.required],
      experiences: this.fb.array([]),
      projects: this.fb.array([]),
      skills: this.fb.array([]),
      education: this.fb.group({
        degree: [''],
        institution: [''],
        year: [''],
        cgpa: ['']
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
    this.pdfService.generate(data);
    this.message = 'PDF Downloaded! All links are clickable.';
    this.messageType = 'success';
  }

  clearForm() {
    while (this.experiences.length) this.experiences.removeAt(0);
    while (this.projects.length) this.projects.removeAt(0);
    while (this.skills.length) this.skills.removeAt(0);
    while (this.achievements.length) this.achievements.removeAt(0);
    this.form.reset();
    this.message = '';
  }

  // ===== Pre-fill Default Data =====
  private prefillDefaultData() {
    this.form.patchValue({
      personalInfo: {
        name: 'Ankaj Kumar',
        title: 'Frontend Engineer',
        phone: '+91-9064748813',
        email: 'ankajkuray@gmail.com',
        linkedin: 'https://www.linkedin.com/in/ankaj-ray',
        github: 'https://github.com/akroy',
        leetcode: 'https://leetcode.com/ankajarya275'
      },
      summary: 'Frontend-focused Software Engineer with ~4 years of experience at InCred Financial Services, architecting scalable, production-grade web applications across fintech business domains. Expert in JavaScript, Angular (v18), and React with end-to-end ownership spanning frontend architecture, BFF layers (NestJS), authentication infrastructure (Keycloak, SSO, OTP), and RBAC systems. Architected multiple internal portals from scratch, published a private npm auth package replacing Auth0 \u2014 drastically reducing licensing costs organization-wide. Proven track record of delivering full-stack, maintainable systems in high-stakes financial environments.',
      education: {
        degree: 'Bachelor of Engineering (B.E.)',
        institution: 'University Institute of Technology, Burdwan',
        year: '2022',
        cgpa: '7.85/10'
      }
    });

    // Experience
    this.addExperience();
    this.experiences.at(0).patchValue({
      company: 'InCred Financial Services',
      role: 'Software Engineer',
      dateRange: 'Aug 2022 \u2013 Present',
      subtitle: 'Joined as a fresher; grew into a system owner architecting portals, auth infrastructure, BFF services & access control systems'
    });

    // Subsection 1
    this.addSubsection(0);
    this.getSubsections(0).at(0).patchValue({ title: 'FRONTEND ARCHITECTURE & PORTAL DEVELOPMENT' });
    const ss0Bullets = [
      'Architected InCred Ops Portal and InCred File Tracker from concept to production using Angular 18 standalone component architecture \u2014 with feature-based module structure, lazy loading, centralized interceptor chains (auth, error, loader), and PrimeNG enterprise UI serving loan processing workflows across multiple internal teams.',
      'Designed scalable Angular project structures with environment-specific build pipelines (dev, QA, UAT, prod), hash-based routing strategy, and functional route guards \u2014 ensuring zero-downtime deployments and secure page-level access control.',
      'Collaborated across 4+ diversified product pods, translating complex fintech business requirements into clean, maintainable, and testable frontend systems.',
      'Established reusable architectural patterns, component libraries, coding standards, and scalable project structures adopted across engineering teams.'
    ];
    const ss0BulletsArr = this.getBullets(0, 0);
    ss0BulletsArr.at(0).setValue(ss0Bullets[0]);
    for (let i = 1; i < ss0Bullets.length; i++) {
      ss0BulletsArr.push(this.fb.control(ss0Bullets[i]));
    }

    // Subsection 2
    this.addSubsection(0);
    this.getSubsections(0).at(1).patchValue({ title: 'AUTHENTICATION, AUTHORIZATION & USER ACCESS MANAGEMENT' });
    const ss1Bullets = [
      'Designed and published @incred-engineers/auth-login \u2014 a framework-agnostic UMD npm package (Webpack 5) delivering end-to-end OTP login and SSO/OAuth 2.0/Keycloak integration via API Gateway \u2014 completely replacing Auth0 and drastically reducing licensing costs organization-wide.',
      'Owned the User Access Management portal end-to-end: designed the RBAC model, built the Angular 18 frontend architecture, integrated Keycloak roles/permissions, and delivered production-ready access control with activity audit logs and multi-environment support.',
      'Implemented granular role-based route guards, permission-driven UI rendering, and admin dashboards for user/role/group management across all InCred internal portals.'
    ];
    const ss1BulletsArr = this.getBullets(0, 1);
    ss1BulletsArr.at(0).setValue(ss1Bullets[0]);
    for (let i = 1; i < ss1Bullets.length; i++) {
      ss1BulletsArr.push(this.fb.control(ss1Bullets[i]));
    }

    // Subsection 3
    this.addSubsection(0);
    this.getSubsections(0).at(2).patchValue({ title: 'BFF (BACKEND-FOR-FRONTEND) & FULL STACK CONTRIBUTIONS' });
    const ss2Bullets = [
      'Designed and maintained BFF orchestration services in NestJS 11 aggregating multiple microservices (Hermes, Document Service, UAM Service) with modular architecture, JWT middleware, Swagger/OpenAPI documentation, custom interceptors, and DTO validation.',
      'Contributed to backend Node.js services, API design, and database queries \u2014 demonstrating full-stack ownership with monitoring and observability integration via custom @incred-engineers packages.'
    ];
    const ss2BulletsArr = this.getBullets(0, 2);
    ss2BulletsArr.at(0).setValue(ss2Bullets[0]);
    for (let i = 1; i < ss2Bullets.length; i++) {
      ss2BulletsArr.push(this.fb.control(ss2Bullets[i]));
    }

    // Projects
    const projects = [
      { name: 'InCred Ops Portal + File Tracker', description: ' \u2014 Owner & Architect, End-to-End  |  Angular 18, TypeScript, PrimeNG, Standalone Components, BFF', githubUrl: 'https://github.com/Incred-Engineers/incred-dms-fe', githubText: 'github.com/Incred-Engineers/incred-dms-fe' },
      { name: 'Auth Login Package', description: ' \u2014 Owner & Architect  |  Webpack 5, UMD, Keycloak, SSO, OTP, OAuth 2.0', githubUrl: 'https://github.com/Incred-Engineers/auth-login', githubText: 'github.com/Incred-Engineers/auth-login' },
      { name: 'User Access Management', description: ' \u2014 Owner, End-to-End  |  Angular 18, RBAC, Keycloak, Audit Logs', githubUrl: 'https://github.com/Incred-Engineers/user-access-management', githubText: 'github.com/Incred-Engineers/user-access-management' },
      { name: 'BFF Ops Services', description: ' \u2014 Owner & Developer  |  NestJS 11, TypeScript, Axios, Swagger, JWT', githubUrl: 'https://github.com/Incred-Engineers/bff-ops', githubText: 'github.com/Incred-Engineers/bff-ops' }
    ];
    projects.forEach(proj => {
      this.addProject();
      this.projects.at(this.projects.length - 1).patchValue(proj);
    });

    // Skills
    const skillsList = [
      { label: 'Languages & Core:  ', value: 'JavaScript (Expert), TypeScript, HTML5, CSS3, SQL, Python, Java, C++' },
      { label: 'Frameworks & Libraries:  ', value: 'Angular 18 (Expert), NestJS, React, Node.js, PrimeNG, RxJS, Bootstrap' },
      { label: 'Architecture & Patterns:  ', value: 'Standalone Components, BFF, Lazy Loading, RBAC, Interceptor Chains, UMD Libraries, Scalable FE Architecture' },
      { label: 'Auth & Security:  ', value: 'Keycloak, SSO, OAuth 2.0, OTP, JWT, RBAC, API Gateway, Auth0' },
      { label: 'Tools & Practices:  ', value: 'Git, GitHub npm Registry, MySQL, REST APIs, Swagger/OpenAPI, CI/CD, Code Reviews, Agile/Scrum, JIRA' }
    ];
    skillsList.forEach(skill => {
      this.addSkill();
      this.skills.at(this.skills.length - 1).patchValue(skill);
    });

    // Achievements
    const achievementsList = [
      'Replaced Auth0 with an in-house authentication package (@incred-engineers/auth-login), saving significant annual licensing costs and becoming the standard auth solution across all InCred portals.',
      '500+ DSA problems solved across LeetCode, GeeksForGeeks, and CodeChef with strong focus on algorithms and data structures.',
      'Newton Coding Contest \u2014 Global Rank 440 out of thousands of participants (April 2022).',
      'Active participant in Hackathons, coding contests, and engineering community events.'
    ];
    achievementsList.forEach(a => {
      this.addAchievement();
      this.achievements.at(this.achievements.length - 1).setValue(a);
    });
  }
}
