import { generateText, Output } from 'ai';
import { z } from 'zod';

import { createTracer, model } from '../../../helpers/index.js';

/**
 * El plan es una lista de llamadas a herramientas con sus argumentos.
 * Zod garantiza que solo aparezcan herramientas que existen.
 */
export const planSchema = z.object({
  steps: z
    .array(
      z.object({
        tool: z.enum(['getCellStatus', 'getGuardLog']),
        villain: z.string(),
        why: z.string().describe('Qué aporta este paso al informe'),
      })
    )
    .min(1)
    .max(12),
});

export type Plan = z.infer<typeof planSchema>;

// Fase 1: PLANIFICAR — una sola llamada, sin herramientas
export async function buildPlan(
  task: string,
  tracer: ReturnType<typeof createTracer>
) {
  const { output: plan } = await generateText({
    model,
    output: Output.object({ schema: planSchema }),
    prompt: task,
    instructions:
      'Eres el oficial de control de la prisión. NO resuelvas la tarea. ' +
      'Lista todas las consultas necesarias para resolverla, en orden. ' +
      'Herramientas disponibles: getCellStatus(villain), getGuardLog(villain).',
    onStepEnd: tracer.onStepFinish,
  });

  return plan;
}
