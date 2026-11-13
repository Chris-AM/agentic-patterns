import { tool } from 'ai';
import { z } from 'zod';

import { PURCHASES } from '../data/purchases.js';
import { APPROVALS, LEDGER } from '../ledger/ledger.js';

// ---------------------------------------------------------------------------
// HERRAMIENTAS
// ---------------------------------------------------------------------------

export const findPurchase = tool({
  description: 'Consulta la compra asociada a un correo. Solo lectura.',
  inputSchema: z.object({
    email: z.string().describe('Correo del cliente del ticket'),
  }),
  execute: async ({ email }) => {
    const purchase = PURCHASES.find((item) => item.email === email);
    return purchase ?? { error: 'Sin compras para ese correo' };
  },
});

export const issueRefund = tool({
  description: 'Devuelve el dinero de una compra. Irreversible.',
  inputSchema: z.object({
    purchaseId: z.string().describe('ID de la compra. ej: "P-1001"'),
    reason: z.string().describe('Motivo del reembolso, en una frase'),
  }),
  execute: async ({ purchaseId }, { toolCallId }) => {
    const purchase = PURCHASES.find((item) => item.id === purchaseId);
    if (!purchase) return { status: 'error', message: 'Compra no encontrada' };

    // Si no pasó por el gate, el efecto queda firmado como automático.
    const approvedBy = APPROVALS.get(toolCallId) ?? 'política (automático)';

    // Ledger = historial de efectos
    // detail = detalle del efecto
    // approvedBy = quién aprobó el efecto
    LEDGER.push({
      detail: `${purchase.id} · ${purchase.course} · ${purchase.amountUSD} USD`,
      approvedBy,
    });

    return { status: 'executed', refundedUSD: purchase.amountUSD, approvedBy };
  },
});

export const TOOLS = { findPurchase, issueRefund };
