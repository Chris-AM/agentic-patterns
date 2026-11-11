import { generateText, stepCountIs } from 'ai';

import { createTracer, model, toolNamesOf } from '../../../helpers/index.js';
import { assertStepBudget, type Specialist } from './specialists.js';

/**
 * Transferir: el especialista solo ve SU instrucción, SUS tools y el texto
 * ORIGINAL (no la interpretación del router). El router ya no participa.
 */
export async function runSpecialist(
  specialist: Specialist,
  text: string,
  { stepBudget, tracer }: { stepBudget: number; tracer: ReturnType<typeof createTracer> }
) {
  assertStepBudget(stepBudget);

  const { text: answer, steps } = await generateText({
    model,
    instructions: specialist.instructions,
    prompt: text,
    tools: specialist.tools,
    stopWhen: stepCountIs(stepBudget),
    onStepEnd: tracer.onStepFinish,
  });

  return { text: answer, toolsUsed: toolNamesOf(steps) };
}
