import { generateText, stepCountIs } from 'ai';

import { createTracer, model } from '../../../helpers/index.js';
import { collectIds } from '../data/answer-checks.js';
import { DEPARTMENTS, type Department } from '../data/departments.js';

// ---------------------------------------------------------------------------
// EL WORKER — un departamento atendiendo una tarea (especialista)
// ---------------------------------------------------------------------------
/**
 * 🔁 MEJORA PARA SOFTWARE REAL (no aplicada para mantener las clases separadas):
 * este worker repite el núcleo que construimos en 08. En un sistema real se
 * reciclaría en vez de duplicarlo:
 *   - runWorker            → router/run-specialist.ts (runSpecialist)
 *   - assertStepBudget     → router/specialists.ts (assertStepBudget)
 *   - DEPARTMENTS          → `satisfies Record<string, Specialist>` + mergeTools
 *   - withRouter (ronda A) → router/classify.ts (classify con RouterConfig)
 * Así, el orquestador sería una capa más sobre el mismo núcleo de especialistas.
 */

/** Techo de pasos del worker: obligatorio, lo define la instancia. */
export function assertStepBudget(stepBudget: number) {
  if (!Number.isInteger(stepBudget) || stepBudget <= 0) {
    throw new RangeError(
      `stepBudget debe ser un entero mayor que 0 (recibido: ${stepBudget})`
    );
  }
}

export async function runWorker(
  department: Department,
  task: string,
  { stepBudget, tracer }: { stepBudget: number; tracer: ReturnType<typeof createTracer> }
) {
  assertStepBudget(stepBudget);
  const config = DEPARTMENTS[department];

  const { text, steps } = await generateText({
    model,
    instructions: config.instructions,
    prompt: task,
    stopWhen: stepCountIs(stepBudget),
    tools: config.tools,
    onStepEnd: tracer.onStepFinish,
  });

  // Los IDs salen de la traza del worker: son la prueba de que la tool corrió.
  return { text: text.trim(), issuedIds: collectIds(steps) };
}
