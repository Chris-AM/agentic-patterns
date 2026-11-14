import type { Purchase } from '../data/purchases.js';
import type { Ledger } from '../ledger/ledger.js';

/**
 * AQUÍ SE DECIDE CUÁNDO SE PAUSA. Nada más que esto.
 *
 * Devolver `undefined` = ejecuta sin preguntar.
 * Devolver 'user-approval' = frena y pide tu decisión.
 *
 * Mejora 5: la política se inyecta (la instancia define los valores) y se
 * mantiene el fail closed: si la compra no existe, se pregunta.
 * Mejora 6: techo agregado. Muchas operaciones pequeñas, cada una dentro de
 * política, pueden sumar un daño grande: superar el techo de la corrida pausa.
 * Los hechos se leen de la fuente de verdad (`purchases`, `ledger`), nunca de
 * un argumento que pueda inventar el modelo.
 */
export type RefundPolicy = {
  refundWindowDays: number;
  maxRefundsPerRun: number;
  maxRefundUSDPerRun: number;
};

export function buildToolApproval({
  purchases,
  ledger,
  policy,
}: {
  purchases: Purchase[];
  ledger: Ledger;
  policy: RefundPolicy;
}) {
  for (const [name, value] of Object.entries(policy)) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`policy.${name} debe ser un número mayor que 0 (recibido: ${value})`);
    }
  }

  return {
    issueRefund: async ({ purchaseId }: { purchaseId: string }) => {
      const purchase = purchases.find((item) => item.id === purchaseId);
      if (!purchase) return 'user-approval' as const;

      if (purchase.daysSincePurchase > policy.refundWindowDays) return 'user-approval' as const;

      const { count, usd } = ledger.totals();
      if (count + 1 > policy.maxRefundsPerRun || usd + purchase.amountUSD > policy.maxRefundUSDPerRun) {
        return 'user-approval' as const;
      }

      return undefined;
    },
  };
}
