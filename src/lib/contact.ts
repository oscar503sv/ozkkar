import { z } from 'astro/zod';

export const CONTACT_TOPICS = ['freelance', 'job', 'other'] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

const optionalText = (max: number) => z.string().trim().max(max).optional().default('');

/** Payload accepted by `POST /api/contact`. */
export const contactSchema = z.object({
  lang: z.enum(['es', 'en']).default('es'),
  topic: z.enum(CONTACT_TOPICS),
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  projectType: optionalText(80),
  company: optionalText(120),
  role: optionalText(120),
  message: z.string().trim().min(1).max(5000),
  /** Honeypot: real visitors never fill it in. */
  website: z.string().optional().default(''),
});

export type ContactPayload = z.infer<typeof contactSchema>;

const TOPIC_LABELS: Record<ContactTopic, string> = {
  freelance: 'Proyecto freelance',
  job: 'Oferta de empleo',
  other: 'Otra cosa',
};

export function buildContactEmail(payload: ContactPayload): { subject: string; text: string } {
  const lines = [
    `Motivo: ${TOPIC_LABELS[payload.topic]}`,
    `Nombre: ${payload.name}`,
    `Email: ${payload.email}`,
    payload.topic === 'freelance' &&
      payload.projectType &&
      `Tipo de proyecto: ${payload.projectType}`,
    payload.topic === 'job' && payload.company && `Empresa: ${payload.company}`,
    payload.topic === 'job' && payload.role && `Puesto: ${payload.role}`,
    `Idioma: ${payload.lang.toUpperCase()}`,
    '',
    payload.message,
  ].filter((line): line is string => typeof line === 'string');

  return {
    subject: `[ozkkar.dev] ${TOPIC_LABELS[payload.topic]} · ${payload.name}`,
    text: lines.join('\n'),
  };
}
