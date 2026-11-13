import { openTicket, resendInvoice, sendCatalog } from '../tools/department-tools.js';

export const DEPARTMENTS = {
  ventas: {
    description: 'Cursos disponibles, precios, descuentos, promociones.',
    instructions:
      'Eres del departamento de ventas de DevTalles. Envía el catálogo con tu ' +
      'herramienta y confirma en una frase citando el identificador. Responde en español.',
    tools: { sendCatalog },
  },
  soporte: {
    description:
      'Problemas de acceso, videos que no cargan, errores de la plataforma.',
    instructions:
      'Eres del departamento de soporte técnico de DevTalles. Abre un ticket ' +
      'con tu herramienta y devuelve su número. Responde en español.',
    tools: { openTicket },
  },
  facturacion: {
    description: 'Facturas, cobros duplicados, comprobantes de pago.',
    instructions:
      'Eres del departamento de facturación de DevTalles. Reenvía o corrige la ' +
      'factura con tu herramienta y devuelve su identificador. Responde en español.',
    tools: { resendInvoice },
  },
} as const;

export type Department = keyof typeof DEPARTMENTS;
export const DEPARTMENT_NAMES = Object.keys(DEPARTMENTS) as [
  Department,
  ...Department[]
];

export const DEPARTMENT_LIST = Object.entries(DEPARTMENTS)
  .map(([name, d]) => `- ${name}: ${d.description}`)
  .join('\n');
// ejemplo de DEPARTMENT_LIST:
// - ventas: Cursos disponibles, precios, descuentos, promociones.
// - soporte: Problemas de acceso, videos que no cargan, errores de la plataforma.
// - facturacion: Facturas, cobros duplicados, comprobantes de pago.
