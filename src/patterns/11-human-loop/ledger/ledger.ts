// ---------------------------------------------------------------------------
// EL LIBRO MAYOR — los efectos irreversibles que sí ocurrieron
// ---------------------------------------------------------------------------
/**
 * Mejora 2: ya no es estado de módulo. Cada corrida crea su propio libro
 * (`createLedger`), así una segunda ejecución en el mismo proceso no arrastra
 * los efectos de la primera. Las lecturas devuelven copias.
 *
 * Mejora 3: además de los efectos, registra TODAS las decisiones (aprobadas,
 * rechazadas y automáticas), con categoría estructurada y nota interna. Es la
 * materia prima para medir la confianza por situación (Gotoh OS, decisión 4).
 */
export type Effect = {
  purchaseId: string;
  detail: string;
  amountUSD: number;
  approvedBy: string;
};

export type DecisionCategory =
  | 'aprobado'
  | 'fuera-de-politica'
  | 'datos-incorrectos'
  | 'falta-informacion'
  | 'otro';

export type Decision = {
  toolCallId: string;
  purchaseId: string;
  approved: boolean;
  by: string;
  category: DecisionCategory;
  /** Solo para el registro y el equipo: nunca llega al modelo ni al cliente. */
  internalNote: string;
};

export function createLedger() {
  const effects: Effect[] = [];
  const decisions: Decision[] = [];
  /** Quién aprobó cada tool call, por toolCallId. */
  const approvals = new Map<string, string>();

  return {
    effects: () => effects.map((effect) => ({ ...effect })),
    decisions: () => decisions.map((decision) => ({ ...decision })),
    recordEffect: (effect: Effect) => void effects.push({ ...effect }),
    recordDecision: (decision: Decision) => void decisions.push({ ...decision }),
    approve: (toolCallId: string, by: string) => void approvals.set(toolCallId, by),
    approvedBy: (toolCallId: string) => approvals.get(toolCallId),
    hasRefund: (purchaseId: string) => effects.some((effect) => effect.purchaseId === purchaseId),
    totals: () => ({
      count: effects.length,
      usd: effects.reduce((sum, effect) => sum + effect.amountUSD, 0),
    }),
  };
}

export type Ledger = ReturnType<typeof createLedger>;
