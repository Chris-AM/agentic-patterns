import { generateText, Output } from 'ai';
import { z } from 'zod';

import { createTracer, model } from '../../../helpers/index.js';

/**
 * El router: prompt mínimo, salida estructurada, cero herramientas.
 */
export async function classify<T extends string>(
  callText: string,
  categories: Record<T, string>,
  tracer: ReturnType<typeof createTracer>
) {
  const names = Object.keys(categories) as [T, ...T[]];

  const { output } = await generateText({
    model,
    output: Output.object({
      schema: z.object({
        department: z.enum(names),
        reason: z.string().describe('Una frase del por qué'),
      }),
    }),
    instructions:
      'Eres un centralista. Transfiere la llamada a UN solo departamento: \n' +
      Object.entries(categories)
        .map(([name, description]) => ` - ${name}: ${description}`)
        .join('\n'),

    prompt: callText,
    onStepEnd: tracer.onStepFinish,
  });

  return output;
}
