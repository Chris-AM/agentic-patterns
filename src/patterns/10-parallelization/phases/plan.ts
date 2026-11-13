import { generateText, Output } from 'ai';
import { z } from 'zod';

import { composeInstructions, type PhaseContext } from './context.js';

// ----- Fase 1: el plan -----------------------------------------------------

/**
 * Salida estructurada. La forma importa:
 *   - `topic` es lo que vemos en consola y en la comparativa.
 *   - `assignment` es el encargo completo para el worker. Debe ser
 *     autocontenido: el worker no ve la petición original ni a los demás.
 *
 * El máximo de tareas lo define la instancia; el mínimo (1) es del núcleo:
 * un plan vacío nunca es válido.
 */
export function buildPlanSchema(maxTasks: number) {
  return z.object({
    tasks: z
      .array(
        z.object({
          topic: z.string().describe('Nombre corto, ej: "PlayStation"'),
          assignment: z
            .string()
            .describe(
              'Encargo completo y autocontenido para un investigador que no conoce la petición original '
            ),
        })
      )
      .min(1)
      .max(maxTasks)
      .describe('Investigaciones independientes entre sí '),
  });
}

/** Regla del mecanismo: es parte del patrón, no del caso. */
const PLAN_RULES =
  'No investigues. Descompón la petición en investigaciones independientes ' +
  'que puedan hacerse a la vez, una por tema. No incluyas temas que no se mencionan.';

export async function plan(ctx: PhaseContext, request: string) {
  const { output } = await generateText({
    model: ctx.model,
    output: Output.object({ schema: buildPlanSchema(ctx.limits.maxTasks) }),
    instructions: composeInstructions(ctx.prompts.planner, PLAN_RULES),
    prompt: request,
    onStepEnd: ctx.tracer.onStepFinish,
  });

  return output.tasks;
}
