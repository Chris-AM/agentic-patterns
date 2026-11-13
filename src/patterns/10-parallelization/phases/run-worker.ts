import { generateText, stepCountIs } from 'ai';

import { composeInstructions, type PhaseContext } from './context.js';

// ----- Fase 2: el worker ---------------------------------------------------

/**
 * Un sub-agente con las tools del caso y un encargo.
 * Devuelve `notes` (su texto) y `data` (las salidas de sus tools leídas de la
 * traza). La integración usa `data` como fuente de verdad: el worker ya no
 * puede «descartar» lo que la tool devolvió.
 */

/** Regla del mecanismo: consultar antes de responder y no inventar. */
const WORKER_RULES =
  'Cumple tu encargo consultando tus herramientas antes de responder. ' +
  'Copia literalmente los datos que devuelvan; no inventes datos que no hayas consultado.';

export type WorkerTask = { subject: string; assignment: string };
export type ToolOutput = { toolName: string; output: unknown };

export async function runWorker(ctx: PhaseContext, task: WorkerTask) {
  const { text, steps } = await generateText({
    model: ctx.model,
    tools: ctx.tools,
    stopWhen: stepCountIs(ctx.limits.workerSteps),
    instructions: composeInstructions(ctx.prompts.worker, WORKER_RULES, ctx.facts),
    prompt: `Asunto: ${task.subject}\n${task.assignment}`,
    onStepEnd: ctx.tracer.onStepFinish,
  });

  const data: ToolOutput[] = steps
    .flatMap((step) => step.toolResults)
    .map(({ toolName, output }) => ({ toolName, output }));

  return { notes: text, data };
}
