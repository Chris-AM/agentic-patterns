import { generateText, Output } from 'ai';
import { z } from 'zod';

import { createTracer, model } from '../../../helpers/index.js';

const planSchema = z.object({
  steps: z
    .array(
      z.object({
        goal: z.string().describe('Qué resuelve este paso, en una frase'),
        reason: z
          .string()
          .describe('¿Por qué es necesario? y ¿Por qué va en esta posición?'),
      })
    )
    .min(2)
    .max(15)
    .describe('Pasos ordenados. Cada paso resuelve UNA sola cosa'),
});

export async function buildPlan(
  mission: string,
  tracer: ReturnType<typeof createTracer>
) {
  const { output } = await generateText({
    model,
    output: Output.object({
      schema: planSchema,
    }),
    prompt: mission,
    instructions:
      'Eres un estratega. NO resuelvas el operativo todavía. ' +
      'Responde en español. ' +
      'Solo descomponlo en pasos ordenados, donde cada paso dependa ' +
      'del resultado del anterior.',
    onStepEnd: tracer.onStepFinish,
  });

  return output.steps;
}
