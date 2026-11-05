import { generateText, Output } from 'ai';
import { z } from 'zod';

import { createTracer, model } from '../../../helpers/index.js';

const naiveVerdictSchema = z.object({
  isGoodEnough: z.boolean().describe('¿El texto está listo para entregar?'),
  comment: z.string().describe('Comentario breve sobre la calidad'),
});

// La auto-evaluación: Sin rúbrica, sin criterios, sin nada
export async function naiveVerdict(
  draft: string,
  tracer: ReturnType<typeof createTracer>
) {
  const { output: verdict } = await generateText({
    model,
    output: Output.object({
      schema: naiveVerdictSchema,
    }),
    prompt: `TEXTO: \n ${draft}`,
    onStepEnd: tracer.onStepFinish,
  });

  return verdict;
}
