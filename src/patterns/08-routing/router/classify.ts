import { generateText, Output } from 'ai';

import { createTracer, model } from '../../../helpers/index.js';
import { buildRouteSchema, routerInstructions, type RouterConfig } from './route-schema.js';

/**
 * El router: prompt mínimo, salida estructurada, cero herramientas.
 * El fallback es obligatorio: el router nunca queda forzado a una categoría.
 */
export async function classify<T extends string, F extends string>(
  text: string,
  router: RouterConfig<T, F>,
  tracer: ReturnType<typeof createTracer>
) {
  const { output } = await generateText({
    model,
    output: Output.object({
      schema: buildRouteSchema(router),
    }),
    instructions: routerInstructions(router),

    prompt: text,
    onStepEnd: tracer.onStepFinish,
  });

  return output;
}
