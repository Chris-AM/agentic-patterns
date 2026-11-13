import { generateText, Output } from 'ai';
import { z } from 'zod';

import { createTracer, model } from '../../../helpers/index.js';
import { RESEARCH_REQUEST } from '../data/research-request.js';

// ----- Fase 1: el plan -----------------------------------------------------

/**
 * Salida estructurada. La forma importa:
 *   - `topic` es lo que vemos en consola y en la comparativa.
 *   - `assignment` es el encargo completo para el worker. Debe ser
 *     autocontenido: el worker no ve la petición original ni a los demás.
 */
export const planSchema = z.object({
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
    .max(8)
    .describe('Investigaciones independientes entre sí '),
});

export async function planResearch(tracer: ReturnType<typeof createTracer>) {
  const { output } = await generateText({
    model,
    output: Output.object({ schema: planSchema }),
    instructions:
      'Eres un planificador. No investigues.' +
      ' Descompón la petición en investigaciones independientes que puedan hacerse a la vez, ' +
      ' una por tema. No incluyas temas que no se mencionan y responde en español. ',
    prompt: RESEARCH_REQUEST,
    onStepEnd: tracer.onStepFinish,
  });

  return output.tasks;
}
