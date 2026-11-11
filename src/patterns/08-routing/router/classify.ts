import { generateText, Output } from 'ai';

import { createTracer, model } from '../../../helpers/index.js';
import { buildRouteSchema, routerInstructions, type Fallback } from './route-schema.js';

/**
 * El router: prompt mínimo, salida estructurada, cero herramientas.
 * El fallback es obligatorio: el router nunca queda forzado a una categoría.
 */
export async function classify<T extends string, F extends string>(
  callText: string,
  categories: Record<T, string>,
  fallback: Fallback<F>,
  tracer: ReturnType<typeof createTracer>
) {
  const { output } = await generateText({
    model,
    output: Output.object({
      schema: buildRouteSchema(categories, fallback),
    }),
    instructions: routerInstructions(categories, fallback),

    prompt: callText,
    onStepEnd: tracer.onStepFinish,
  });

  return output;
}
