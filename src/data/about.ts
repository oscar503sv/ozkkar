import type { Lang } from '../i18n/config';

type Localized = Record<Lang, string>;

export interface NowItem {
  icon: string;
  text: Localized;
  href?: string;
}

/** "Right now" card on the About page. Keep it short and current. */
export const NOW: NowItem[] = [
  {
    icon: 'graduation-cap',
    text: {
      es: 'Terminando Ingeniería en Ciencias de la Computación en la Universidad Don Bosco',
      en: 'Finishing my Computer Science Engineering degree at Universidad Don Bosco',
    },
  },
  {
    icon: 'video-camera',
    text: {
      es: 'Desarrollando Reelix, mi grabador de pantalla nativo para Linux',
      en: 'Building Reelix, my native screen recorder for Linux',
    },
    href: 'https://github.com/oscar503sv/reelix',
  },
  {
    icon: 'package',
    text: {
      es: 'Construyendo Inventory ERP, un sistema de inventario en .NET 10',
      en: 'Building Inventory ERP, an inventory system on .NET 10',
    },
  },
  {
    icon: 'pen-nib',
    text: {
      es: 'Escribiendo en el blog sobre lo que aprendo en cada proyecto',
      en: 'Writing on the blog about what I learn in each project',
    },
  },
];

export interface Principle {
  icon: string;
  title: Localized;
  body: Localized;
}

/** "How I work" cards on the About page. */
export const PRINCIPLES: Principle[] = [
  {
    icon: 'tree-structure',
    title: { es: 'Arquitectura y pruebas', en: 'Architecture and tests' },
    body: {
      es: 'Separo responsabilidades, escribo pruebas y documento. El código tiene que funcionar hoy y seguir siendo fácil de cambiar mañana.',
      en: 'I separate concerns, write tests and document. Code has to work today and stay easy to change tomorrow.',
    },
  },
  {
    icon: 'rocket-launch',
    title: { es: 'De la idea a producción', en: 'From idea to production' },
    body: {
      es: 'No me quedo en el código: despliego, monitoreo y mantengo. Mis proyectos corren en servidores que administro yo mismo.',
      en: "I don't stop at the code: I deploy, monitor and maintain. My projects run on servers I manage myself.",
    },
  },
  {
    icon: 'chats-circle',
    title: { es: 'Entiendo a quien lo va a usar', en: 'I understand who will use it' },
    body: {
      es: 'Me siento con personas no técnicas, entiendo cómo trabajan y lo convierto en una herramienta que de verdad usan.',
      en: 'I sit down with non-technical people, learn how they work and turn that into a tool they actually use.',
    },
  },
  {
    icon: 'git-branch',
    title: { es: 'Software libre', en: 'Open source' },
    body: {
      es: 'Uso Linux a diario, contribuyo a proyectos open source y publico mi código para que otros aprendan de él.',
      en: 'I use Linux every day, contribute to open source projects and publish my code so others can learn from it.',
    },
  },
];
