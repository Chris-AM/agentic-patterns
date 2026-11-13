// ---------------------------------------------------------------------------
// LOS DATOS — dos compras: una dentro de plazo, otra muy fuera
// ---------------------------------------------------------------------------

export type Purchase = {
  id: string;
  email: string;
  course: string;
  amountUSD: number;
  daysSincePurchase: number;
};

export const PURCHASES: Purchase[] = [
  {
    id: 'P-1001',
    email: 'ana@correo.com',
    course: 'Docker para desarrolladores',
    amountUSD: 17.99,
    daysSincePurchase: 5, // dentro de plazo → se ejecuta sin preguntar
  },
  {
    id: 'P-2044',
    email: 'luis@correo.com',
    course: 'Bundle Full Stack (6 cursos)',
    amountUSD: 299.0,
    daysSincePurchase: 180, // fuera de plazo → gate
  },
];

/** La política NO decide: solo marca qué necesita una firma humana. */
export const REFUND_WINDOW_DAYS = 30;
