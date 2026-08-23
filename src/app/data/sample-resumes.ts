import { ResumeData } from '../models/resume.model';

const personalInfo = {
  name: 'Alex Morgan',
  phone: '+1-555-0142',
  email: 'alex.morgan@example.com',
  linkedin: 'https://linkedin.com/in/alexmorgan-dev',
  github: 'https://github.com/alexmorgan-dev',
  leetcode: 'https://leetcode.com/alexmorgan',
  location: 'Austin, TX, USA'
};

const education = {
  degree: 'B.S. in Computer Science',
  institution: 'State University',
  year: '2018',
  cgpa: '3.7/4.0',
  location: 'Austin, TX, USA'
};

export const sampleFrontend: ResumeData = {
  personalInfo: { ...personalInfo, title: 'Senior Frontend Engineer' },
  summary: 'Frontend Engineer with 5+ years building responsive, accessible web applications in React and Angular. Led a customer dashboard redesign used by 50,000+ monthly users, cutting page load time by 35%. Skilled in TypeScript, component architecture, state management, and close collaboration with design and backend teams.',
  experiences: [
    {
      company: 'BrightPath Technologies',
      role: 'Senior Frontend Engineer',
      dateRange: 'Jan 2021 - Present',
      subtitle: 'Owns the core customer dashboard and the internal component library used across 5 product teams',
      subsections: [
        {
          title: 'Frontend Architecture & Performance',
          bullets: [
            'Led the redesign of the customer dashboard (React, TypeScript, Redux) serving 50,000+ monthly active users, reducing initial page load time by 35%.',
            'Migrated legacy class components to React hooks and introduced code-splitting, cutting bundle size by 28%.',
            'Built a shared component library adopted by 5 product teams, reducing new feature build time by 30%.'
          ]
        },
        {
          title: 'Collaboration & Quality',
          bullets: [
            'Partnered with design and backend teams to ship 10+ features per quarter using Agile/Scrum workflows.',
            'Set up automated visual regression and accessibility testing, reducing production UI bugs by 40%.'
          ]
        }
      ]
    }
  ],
  projects: [
    {
      name: 'Customer Dashboard Redesign',
      description: 'React, TypeScript, Redux, 50,000+ monthly users, 35% faster load time',
      githubUrl: 'https://github.com/alexmorgan-dev/dashboard-redesign',
      githubText: 'github.com/alexmorgan-dev/dashboard-redesign'
    },
    {
      name: 'Internal Component Library',
      description: 'Storybook, TypeScript, adopted across 5 product teams',
      githubUrl: 'https://github.com/alexmorgan-dev/component-library',
      githubText: 'github.com/alexmorgan-dev/component-library'
    },
    {
      name: 'Marketing Site Revamp',
      description: 'Next.js, Tailwind CSS, improved Lighthouse score from 62 to 96',
      githubUrl: 'https://github.com/alexmorgan-dev/marketing-site',
      githubText: 'github.com/alexmorgan-dev/marketing-site'
    }
  ],
  skills: [
    { label: 'Languages: ', value: 'JavaScript (ES6+), TypeScript, HTML5, CSS3, SQL' },
    { label: 'Frameworks & Libraries: ', value: 'React, Angular, Redux, Next.js, Tailwind CSS' },
    { label: 'Tools & Testing: ', value: 'Jest, Cypress, Storybook, Git, CI/CD, Webpack' },
    { label: 'Soft Skills: ', value: 'Cross-Team Collaboration, Mentoring, Agile Delivery, Communication' }
  ],
  education,
  achievements: [
    'Reduced customer dashboard load time by 35%, directly improving user retention metrics.',
    'Mentored 3 junior engineers, two of whom were promoted within a year.',
    'Speaker at a regional frontend meetup on accessible component design.'
  ],
  keyAchievements: [
    {
      title: 'Dashboard Performance Overhaul',
      description: '**Reduced page load time by 35%** for a dashboard serving **50,000+ monthly users**, directly improving retention metrics.'
    },
    {
      title: 'Component Library Adoption',
      description: 'Built a shared component library **adopted across 5 product teams**, cutting new feature build time by 30%.'
    },
    {
      title: 'Mentorship',
      description: 'Mentored 3 junior engineers, **two promoted within a year**.'
    }
  ]
};

export const sampleBackend: ResumeData = {
  personalInfo: { ...personalInfo, title: 'Senior Backend Engineer (Node.js)' },
  summary: 'Backend Engineer with 5+ years designing and scaling Node.js/Express APIs and microservices. Rebuilt a checkout service handling 50,000+ monthly transactions, cutting p95 latency by 40%. Skilled in REST API design, PostgreSQL, message queues, and building systems that stay reliable under load.',
  experiences: [
    {
      company: 'BrightPath Technologies',
      role: 'Senior Backend Engineer',
      dateRange: 'Jan 2021 - Present',
      subtitle: 'Owns the checkout and payments services powering 50,000+ monthly transactions',
      subsections: [
        {
          title: 'Backend Architecture & Scalability',
          bullets: [
            'Rebuilt the checkout service (Node.js, Express, PostgreSQL) handling 50,000+ monthly transactions, cutting p95 latency by 40%.',
            'Designed an event-driven order pipeline using RabbitMQ, decoupling 4 downstream services and improving fault isolation.',
            'Introduced database connection pooling and query optimization, reducing peak-load database CPU by 30%.'
          ]
        },
        {
          title: 'Reliability & DevOps',
          bullets: [
            'Set up centralized logging and alerting, cutting mean time to detect production incidents from 25 minutes to under 5.',
            'Migrated deployment pipeline to Docker + CI/CD, enabling zero-downtime releases across 3 environments.'
          ]
        }
      ]
    }
  ],
  projects: [
    {
      name: 'Checkout Service Rebuild',
      description: 'Node.js, Express, PostgreSQL, 50,000+ monthly transactions, 40% latency reduction',
      githubUrl: 'https://github.com/alexmorgan-dev/checkout-service',
      githubText: 'github.com/alexmorgan-dev/checkout-service'
    },
    {
      name: 'Order Event Pipeline',
      description: 'RabbitMQ, event-driven architecture, decoupled 4 downstream services',
      githubUrl: 'https://github.com/alexmorgan-dev/order-events',
      githubText: 'github.com/alexmorgan-dev/order-events'
    },
    {
      name: 'Internal Admin API',
      description: 'REST API, JWT auth, role-based access control for internal tooling',
      githubUrl: 'https://github.com/alexmorgan-dev/admin-api',
      githubText: 'github.com/alexmorgan-dev/admin-api'
    }
  ],
  skills: [
    { label: 'Languages: ', value: 'JavaScript (ES6+), TypeScript, SQL, Python' },
    { label: 'Backend & Runtime: ', value: 'Node.js, Express, NestJS, REST API Design, Microservices' },
    { label: 'Databases & Messaging: ', value: 'PostgreSQL, Redis, RabbitMQ, MongoDB' },
    { label: 'Tools & DevOps: ', value: 'Docker, Git, CI/CD, Jest, AWS' }
  ],
  education,
  achievements: [
    'Cut checkout service p95 latency by 40% while scaling to 50,000+ monthly transactions.',
    'Reduced mean-time-to-detect for production incidents from 25 minutes to under 5.',
    'Mentored 3 junior engineers, two of whom were promoted within a year.'
  ],
  keyAchievements: [
    {
      title: 'Checkout Service Rebuild',
      description: '**Cut p95 latency by 40%** while scaling the checkout service to **50,000+ monthly transactions**.'
    },
    {
      title: 'Incident Response Overhaul',
      description: 'Reduced mean-time-to-detect for production incidents **from 25 minutes to under 5**.'
    },
    {
      title: 'Mentorship',
      description: 'Mentored 3 junior engineers, **two promoted within a year**.'
    }
  ]
};
