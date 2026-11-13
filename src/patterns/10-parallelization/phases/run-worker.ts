import { generateText, stepCountIs } from 'ai';

import { composeInstructions, type PhaseContext } from './context.js';

// ----- Fase 2: el worker ---------------------------------------------------

/**
 * Un sub-agente con las tools del caso y un encargo.
 * Devuelve texto. Es el mismo runWorker que en los labs anteriores.
 */

/** Regla del mecanismo: consultar antes de responder y no inventar. */
const WORKER_RULES =
  'Cumple tu encargo consultando tus herramientas antes de responder. ' +
  'Copia literalmente los datos que devuelvan; no inventes datos que no hayas consultado.';

export async function runWorker(ctx: PhaseContext, assignment: string) {
  const { text } = await generateText({
    model: ctx.model,
    tools: ctx.tools,
    stopWhen: stepCountIs(ctx.limits.workerSteps),
    instructions: composeInstructions(ctx.prompts.worker, WORKER_RULES),
    prompt: assignment,
    onStepEnd: ctx.tracer.onStepFinish,
  });

  return text;
}
