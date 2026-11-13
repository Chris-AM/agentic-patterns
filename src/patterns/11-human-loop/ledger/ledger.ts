// ---------------------------------------------------------------------------
// EL LIBRO MAYOR — los efectos irreversibles que sí ocurrieron
// ---------------------------------------------------------------------------

export type Effect = { detail: string; approvedBy: string };

export const LEDGER: Effect[] = []; // Este será un arreglo de efectos que ocurrieron.

/** Quién aprobó cada tool call, por toolCallId. */
export const APPROVALS = new Map<string, string>();
