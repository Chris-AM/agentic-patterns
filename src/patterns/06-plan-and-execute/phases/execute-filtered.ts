import { MAX_INTEGRITY, MIN_INCIDENTS } from '../data/tasks.js';
import { registry } from '../tools/registry.js';
import type { Plan } from './plan.js';

// ---------------------------------------------------------------------------
// MEJORA PROPIA (no viene del curso) — filtro programado entre fases
// ---------------------------------------------------------------------------
//* La condición de la tarea adaptativa («2 o más incidentes», «integridad
//* inferior a 50») es CUANTITATIVA. Por la regla «lo cuantitativo lo hace
//* cumplir el código», no se le deja al modelo: se evalúa aquí con
//* parámetros programados (MIN_INCIDENTS, MAX_INTEGRITY en data/tasks.ts).
//*
//* Así Plan-and-Execute resuelve la tarea adaptativa SIN volver a llamar
//* al modelo entre fases:
//*   1. Ejecuta las bitácoras que pidió el plan.
//*   2. El CÓDIGO filtra los villanos con incidentes ≥ MIN_INCIDENTS.
//*   3. El CÓDIGO consulta solo esas celdas y marca integridad < MAX_INTEGRITY.
//* Las consultas de celda que haya planificado el modelo se ignoran: qué
//* celdas revisar lo decide el filtro, no el plan.

export function executeFilteredPlan(plan: Plan) {
  // 1. Bitácoras: los villanos salen del plan (el modelo interpreta el texto).
  const logSteps = plan.steps.filter((step) => step.tool === 'getGuardLog');
  const logs = logSteps.map((step) => ({
    step: `getGuardLog(${step.villain})`,
    villain: step.villain,
    result: registry.getGuardLog.run(step.villain),
  }));

  // 2. Filtro programado: decide el código, no el modelo.
  const escalated = logs.filter(
    ({ result }) => 'incidents' in result && result.incidents >= MIN_INCIDENTS
  );

  // 3. Celdas solo de los filtrados, con la marca de integridad calculada.
  const cells = escalated.map(({ villain }) => {
    const cell = registry.getCellStatus.run(villain);
    return {
      step: `getCellStatus(${villain})`,
      result:
        'integrity' in cell
          ? { ...cell, integrityBelowThreshold: cell.integrity < MAX_INTEGRITY }
          : cell,
    };
  });

  console.log(
    `\n Filtro programado: incidentes ≥ ${MIN_INCIDENTS} → ` +
      `${escalated.map((e) => e.villain).join(', ') || 'ninguno'}`.yellow
  );

  return [...logs.map(({ step, result }) => ({ step, result })), ...cells];
}
