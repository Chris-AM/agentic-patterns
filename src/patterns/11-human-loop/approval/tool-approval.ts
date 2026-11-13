import { PURCHASES, REFUND_WINDOW_DAYS } from '../data/purchases.js';

/**
 * AQUÍ SE DECIDE CUÁNDO SE PAUSA. Nada más que esto.
 *
 * Devolver `undefined` = ejecuta sin preguntar.
 * Devolver 'user-approval' = frena y pide tu decisión.
 *
 */
export const TOOL_APPROVAL = {
  issueRefund: async ({ purchaseId }: { purchaseId: string }) => {
    const purchase = PURCHASES.find((item) => item.id === purchaseId);
    if (!purchase) return 'user-approval';

    return purchase.daysSincePurchase <= REFUND_WINDOW_DAYS
      ? undefined
      : 'user-approval';
  },
};
