export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  experiences: Experience[];
  projects: Project[];
  skills: SkillCategory[];
  education: Education;
  achievements: string[];
}

export interface PersonalInfo {
  name: string;
  title: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  leetcode: string;
}

export interface Experience {
  company: string;
  role: string;
  dateRange: string;
  subtitle: string;
  subsections: SubSection[];
}

export interface SubSection {
  title: string;
  bullets: string[];
}

export interface Project {
  name: string;
  description: string;
  githubUrl: string;
  githubText: string;
}

export interface SkillCategory {
  label: string;
  value: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  cgpa: string;
}
