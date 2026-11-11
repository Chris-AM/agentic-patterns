import type { Specialist } from '../router/specialists.js';
import { openTicket, resendInvoice, sendCatalog } from '../tools/department-tools.js';

// ---------------------------------------------------------------------------
// LOS DEPARTAMENTOS
// ---------------------------------------------------------------------------

export const DEPARTMENTS = {
  ventas: {
    description: 'Cursos disponibles, precios, descuentos, promociones.',
    instructions:
      'Eres del departamento de ventas de DevTalles. Envía el catálogo con tu ' +
      'herramienta y confirma en una frase. Responde en español.',
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
} as const satisfies Record<string, Specialist>;

export type Department = keyof typeof DEPARTMENTS;

/**
 * La tool esperada se deriva de la única llave de `tools` (antes era un texto
 * repetido: si se renombraba la tool, el juez fallaba en silencio).
 */
export function expectedToolOf(department: Department) {
  return Object.keys(DEPARTMENTS[department].tools)[0]!;
}

/** Rol del router en esta instancia. */
export const ROUTER_ROLE =
  'Eres un centralista. Transfiere la llamada a UN solo departamento.';

/**
 * Ruta de escape del router: lo ambiguo o fuera de dominio no se fuerza a un
 * departamento. La atiende una persona, sin modelo ni herramientas.
 */
export const FALLBACK = {
  route: 'humano',
  description:
    'Llamadas ambiguas, fuera de los temas anteriores o que piden hablar con una persona.',
} as const;

export type Route = Department | typeof FALLBACK.route;
