import { tool } from 'ai';
import { z } from 'zod';

import type { Purchase } from '../data/purchases.js';
import type { Ledger } from '../ledger/ledger.js';

// ---------------------------------------------------------------------------
// HERRAMIENTAS
// ---------------------------------------------------------------------------

const AUTOMATIC = 'política (automático)';

/** Las tools reciben los datos y el libro de ESTA corrida (sin estado de módulo). */
export function buildRefundTools({ purchases, ledger }: { purchases: Purchase[]; ledger: Ledger }) {
  const findPurchase = tool({
    description: 'Consulta la compra asociada a un correo. Solo lectura.',
    inputSchema: z.object({
      email: z.string().describe('Correo del cliente del ticket'),
    }),
    execute: async ({ email }) => {
      const purchase = purchases.find((item) => item.email === email);
      return purchase ?? { error: 'Sin compras para ese correo' };
    },
  });

  const issueRefund = tool({
    description: 'Devuelve el dinero de una compra. Irreversible.',
    inputSchema: z.object({
      purchaseId: z.string().describe('ID de la compra. ej: "P-1001"'),
      reason: z.string().describe('Motivo del reembolso, en una frase'),
    }),
    execute: async ({ purchaseId }, { toolCallId }) => {
      const purchase = purchases.find((item) => item.id === purchaseId);
      if (!purchase) return { status: 'error', message: 'Compra no encontrada' };

      // Mejora 2 — idempotencia: la garantía contra duplicados es el código, no el historial.
      if (ledger.hasRefund(purchaseId)) {
        return { status: 'already-refunded', message: `${purchaseId} ya fue reembolsada` };
      }

      // Si no pasó por el gate, el efecto queda firmado como automático,
      // y la decisión automática también se registra (mejora 3).
      const approvedBy = ledger.approvedBy(toolCallId) ?? AUTOMATIC;
      if (approvedBy === AUTOMATIC) {
        ledger.recordDecision({
          toolCallId,
          purchaseId,
          approved: true,
          by: AUTOMATIC,
          category: 'aprobado',
          internalNote: 'Dentro de política',
        });
      }

      // Ledger = historial de efectos
      // detail = detalle del efecto
      // approvedBy = quién aprobó el efecto
      ledger.recordEffect({
        purchaseId,
        detail: `${purchase.id} · ${purchase.course} · ${purchase.amountUSD} USD`,
        amountUSD: purchase.amountUSD,
        approvedBy,
      });

      return { status: 'executed', refundedUSD: purchase.amountUSD, approvedBy };
    },
  });

  return { findPurchase, issueRefund };
}
