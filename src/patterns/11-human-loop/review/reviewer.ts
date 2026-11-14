import type { DecisionCategory } from '../ledger/ledger.js';

// ---------------------------------------------------------------------------
// EL REVISOR COMO INTERFAZ — la terminal es solo una implementación
// ---------------------------------------------------------------------------
/**
 * Mejora 4: el bucle depende de este contrato, no de la terminal. En las
 * pruebas se usa un revisor falso; en la vida real podría ser una base de
 * datos o un sistema de aprobaciones (como sugiere el docente).
 *
 * Mejora 3: la decisión trae una categoría estructurada (medible) y separa
 * la nota interna del mensaje para el cliente, para que una nota como
 * «sospecho fraude» nunca llegue al modelo ni al cliente.
 *
 * 🔁 MEJORA PARA SOFTWARE REAL (no aplicada en el lab): «modificar» la acción
 * antes de aprobarla (ej. un reembolso parcial). El AI SDK del curso solo
 * maneja aprobar o rechazar; habría que construirlo aparte (rechazar y
 * reproponer, o sobrescribir los argumentos). LangChain lo trae como `edit`
 * y advierte que las ediciones grandes pueden hacer que el modelo reevalúe su
 * plan y repita acciones: editar de forma conservadora (el monto, no la acción).
 */
export type ReviewRequest = { purchaseId: string; reason: string };

export type Verdict = {
  approved: boolean;
  by: string;
  category: DecisionCategory;
  internalNote: string;
  /** Lo único de la decisión que el modelo ve, para redactar al cliente. */
  customerMessage: string;
};

export type Reviewer = {
  review: (request: ReviewRequest) => Promise<Verdict>;
  close?: () => void;
};
