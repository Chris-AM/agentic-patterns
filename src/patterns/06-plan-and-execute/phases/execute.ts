import { getCellStatus, getGuardLog } from '../data/prison.js';
import type { Plan } from './plan.js';

// Ejecutor: puro código, el modelo no participa.
// La idea es tener las funciones de las herramientas disponibles para ejecutarlas.
export const executors = {
  getCellStatus: getCellStatus,
  getGuardLog: getGuardLog,
} as const;

// Fase 2: EJECUTAR — el código recorre el plan. Cero llamadas al modelo.
export function executePlan(plan: Plan) {
  return plan.steps.map((step) => ({
    step: `${step.tool}(${step.villain})`,
    result: executors[step.tool](step.villain),
  }));
}
