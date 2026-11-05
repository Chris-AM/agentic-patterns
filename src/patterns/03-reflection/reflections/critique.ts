import { generateText, Output } from 'ai';
import { z } from 'zod';

import { createTracer, model } from '../../../helpers/index.js';

const criticSchema = z.object({
  missing: z
    .array(
      z.object({
        requirementNumber: z.number(),
        evidence: z
          .string()
          .describe('Cita LITERAL del texto que lo cumple, o "NINGUNA"'),
        passed: z.boolean(),
      })
    )
    .describe(
      'Requisitos NO cumplidos, citando el número de cada uno y la descripción que no cumplió'
    ),
  isComplete: z
    .boolean()
    .describe('TRUE solo si TODOS los requisitos se cumplen.'),
});

export type Critique = z.infer<typeof criticSchema>;

export async function critique(
  requirements: string[],
  draft: string,
  tracer: ReturnType<typeof createTracer>
) {
  const { output } = await generateText({
    model,
    output: Output.object({ schema: criticSchema }),
    prompt:
      `REQUISITOS: \n` +
      requirements.map((r, i) => `  ${i + 1}. ${r}`).join('\n') +
      `\n\nTEXTO A REVISAR: \n ${draft}`,
    instructions:
      'Eres un revisor estricto. Verifica el texto UNO POR UNO contra ' +
      'cada requisito de la lista. No asumas que algo está cumplido: ' +
      'búscalo literalmente en el texto. Es mejor marcar de más que de menos.',
    onStepEnd: tracer.onStepFinish,
  });

  return output;
}
