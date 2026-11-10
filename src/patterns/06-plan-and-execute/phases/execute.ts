import { registry } from '../tools/registry.js';
import type { Plan } from './plan.js';

// Ejecutor: puro código, el modelo no participa.
// Las funciones salen del registro único de herramientas.

// Fase 2: EJECUTAR — el código recorre el plan. Cero llamadas al modelo.
export function executePlan(plan: Plan) {
  return plan.steps.map((step) => ({
    step: `${step.tool}(${step.villain})`,
    result: registry[step.tool].run(step.villain),
  }));
}
