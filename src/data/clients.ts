import type { Lang } from '../i18n/config';

export interface ClientWork {
  name: Record<Lang, string>;
  description: Record<Lang, string>;
  stack: string[];
}

export const CLIENTS: ClientWork[] = [
  {
    name: {
      es: 'Registro de casos de violencia para una ONG',
      en: 'Case management system for a nonprofit',
    },
    description: {
      es: 'Formularios especializados para las áreas legal y psicológica, control de acceso por roles y manejo confidencial de la información. Capacité a las usuarias finales para su adopción.',
      en: 'Specialized forms for legal and psychological teams, role-based access control and confidential data handling. I trained the end users for adoption.',
    },
    stack: ['Laravel', 'MySQL', 'RBAC'],
  },
  {
    name: {
      es: 'Automatización de facturas electrónicas (DTE)',
      en: 'E-invoice (DTE) automation',
    },
    description: {
      es: 'Script que extrae las facturas recibidas por Gmail y las registra en Google Sheets, separadas por cliente y por ventas/compras, eliminando la digitación manual.',
      en: 'Script that pulls incoming invoices from Gmail and logs them in Google Sheets by client and by sales/purchases, removing manual data entry.',
    },
    stack: ['Google Apps Script', 'Gmail', 'Sheets'],
  },
];
