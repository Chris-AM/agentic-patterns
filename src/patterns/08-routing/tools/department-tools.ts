import { tool } from 'ai';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// LAS HERRAMIENTAS — una por departamento, disjuntas
// ---------------------------------------------------------------------------

export const sendCatalog = tool({
  description: 'Envía el catálogo de cursos y precios al cliente. Solo ventas.',
  inputSchema: z.object({
    interest: z.string().describe('Tema de interés, ej: "Flutter"'),
  }),
  execute: async ({ interest }) => ({ sent: true, interest }),
});

export const openTicket = tool({
  description:
    'Abre un ticket de soporte técnico por un problema de acceso o de plataforma.',
  inputSchema: z.object({
    issue: z.string(),
  }),
  execute: async ({ issue }) => ({
    ticketId: `TK-${Math.floor(Math.random() * 9000 + 1000)}`,
    issue,
  }),
});

export const resendInvoice = tool({
  description: 'Reenvía o corrige una factura de una compra. Solo facturación.',
  inputSchema: z.object({
    reason: z.string(),
  }),
  execute: async ({ reason }) => ({
    invoiceId: `INV-${Math.floor(Math.random() * 9000 + 1000)}`,
    reason,
  }),
});
