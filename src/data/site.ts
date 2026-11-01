export const SITE = {
  author: 'Oscar Aragón',
  domain: 'ozkkar.dev',
  email: 'hello@ozkkar.dev',
  timeZone: 'America/El_Salvador',
} as const;

export interface SocialLink {
  label: string;
  handle: string;
  href: string;
  icon: string;
}

export const SOCIALS: SocialLink[] = [
  {
    label: 'GitHub',
    handle: '@oscar503sv',
    href: 'https://github.com/oscar503sv',
    icon: 'github-logo',
  },
  {
    label: 'LinkedIn',
    handle: 'Oscar Aragón',
    href: 'https://linkedin.com/in/oscar-hernandez-2a6a021a8',
    icon: 'linkedin-logo',
  },
];
