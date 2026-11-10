import { generateText } from 'ai';

import { createTracer, model } from '../../../helpers/index.js';
import { executePlan } from './execute.js';

// Fase 3: SINTETIZAR — una sola llamada con todos los resultados
export async function synthesizeReport(
  task: string,
  results: ReturnType<typeof executePlan>,
  tracer: ReturnType<typeof createTracer>
) {
  const { text } = await generateText({
    model,
    prompt:
      `TAREA:\n${task}\n\n` +
      `RESULTADOS:\n${JSON.stringify(results, null, 2)}`,
    instructions:
      'Redacta el informe usando ÚNICAMENTE los resultados proporcionados. ' +
      'Si falta un dato, indícalo; no lo inventes.',
    onStepEnd: tracer.onStepFinish,
  });

  return text;
}
