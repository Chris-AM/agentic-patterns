import { tool } from 'ai';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// LOS DEPARTAMENTOS — iguales que en el lab 08, con tools disjuntas
// ---------------------------------------------------------------------------
// Cada tool devuelve un identificador que solo existe si se ejecutó.
// Ese identificador es la prueba: si aparece en la respuesta final,
// el departamento trabajó y el resultado llegó al cliente.

const randomId = () => Math.floor(Math.random() * 9000 + 1000);

export const sendCatalog = tool({
  description: 'Envía el catálogo de cursos y precios al cliente. Solo ventas.',
  inputSchema: z.object({
    interest: z.string().describe('Tema de interés, ej: "Flutter"'),
  }),
  execute: async ({ interest }) => {
    const catalogId = `CAT-${randomId()}`;
    console.log(`       🔧 sendCatalog(${interest}) → ${catalogId}`.yellow);
    return { catalogId, interest };
  },
});

export const openTicket = tool({
  description:
    'Abre un ticket de soporte técnico por un problema de acceso o de plataforma.',
  inputSchema: z.object({ issue: z.string() }),
  execute: async ({ issue }) => {
    const ticketId = `TK-${randomId()}`;
    console.log(`       🔧 openTicket(${issue}) → ${ticketId}`.yellow);
    return { ticketId, issue };
  },
});

export const resendInvoice = tool({
  description: 'Reenvía o corrige una factura de una compra. Solo facturación.',
  inputSchema: z.object({ reason: z.string() }),
  execute: async ({ reason }) => {
    const invoiceId = `INV-${randomId()}`;
    console.log(`       🔧 resendInvoice(${reason}) → ${invoiceId}`.yellow);
    return { invoiceId, reason };
  },
});
