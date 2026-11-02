import type { Lang } from '../i18n/config';

export interface SkillGroup {
  group: Record<Lang, string>;
  icon: string;
  items: string[] | Record<Lang, string[]>;
}

export const SKILLS: SkillGroup[] = [
  {
    group: { es: 'Lenguajes', en: 'Languages' },
    icon: 'code',
    items: ['Python', 'JavaScript', 'TypeScript', 'PHP', 'C#', 'SQL', 'Kotlin'],
  },
  {
    group: { es: 'Backend', en: 'Backend' },
    icon: 'database',
    items: [
      'FastAPI',
      'Laravel',
      'Node.js',
      'ASP.NET Core + EF Core',
      'Django',
      'REST',
      'JWT',
      'RBAC',
    ],
  },
  {
    group: { es: 'Frontend y móvil', en: 'Frontend & mobile' },
    icon: 'layout',
    items: ['React', 'Next.js', 'Tailwind CSS', 'Jetpack Compose', 'React Native'],
  },
  {
    group: { es: 'Bases de datos', en: 'Databases' },
    icon: 'table',
    items: ['PostgreSQL', 'MySQL / MariaDB', 'SQL Server', 'Firestore'],
  },
  {
    group: { es: 'DevOps e infraestructura', en: 'DevOps & infrastructure' },
    icon: 'cloud',
    items: [
      'Docker',
      'Dev Containers',
      'Linux (Ubuntu Server, Fedora, Arch)',
      'Nginx',
      'Coolify',
      'Cloudflare',
      'AWS S3',
      'Railway',
    ],
  },
  {
    group: { es: 'Prácticas', en: 'Practices' },
    icon: 'check-square',
    items: {
      es: ['Git', 'Clean Architecture', 'Pruebas automatizadas', 'Postman', 'Scrum', 'Apps Script'],
      en: ['Git', 'Clean Architecture', 'Automated testing', 'Postman', 'Scrum', 'Apps Script'],
    },
  },
];

/** Main stack: highlighted at the top of the skills section and inside each group. */
export const CORE_STACK = [
  'Python',
  'TypeScript',
  'FastAPI',
  'React',
  'Next.js',
  'PostgreSQL',
  'Docker',
  'Linux (Ubuntu Server, Fedora, Arch)',
];

export function isCoreSkill(item: string): boolean {
  return CORE_STACK.includes(item);
}

/** Short label for the core stack strip. */
export function coreLabel(item: string): string {
  return item.replace(/\s*\(.*\)$/, '');
}

/** Items of a group in the given language, core skills first. */
export function skillItems(skill: SkillGroup, lang: Lang): string[] {
  const items = Array.isArray(skill.items) ? skill.items : skill.items[lang];
  return [...items.filter(isCoreSkill), ...items.filter((item) => !isCoreSkill(item))];
}
