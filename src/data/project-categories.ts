export const PROJECT_CATEGORIES = ['backend', 'web', 'mobile', 'infra', 'oss'] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const CATEGORY_ICONS: Record<ProjectCategory, string> = {
  backend: 'database',
  web: 'browser',
  mobile: 'device-mobile',
  infra: 'hard-drives',
  oss: 'git-branch',
};
