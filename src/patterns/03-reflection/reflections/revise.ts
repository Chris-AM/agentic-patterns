import { generateText } from 'ai';

import { createTracer, model } from '../../../helpers/index.js';
import type { Critique } from './critique.js';

// Reescribir en caso de problemas encontrados
export async function revise(
  draft: string,
  missing: Critique['missing'],
  context: string,
  tracer: ReturnType<typeof createTracer>
) {
  const { text: revised } = await generateText({
    model,
    instructions:
      'Reescribe el briefing corrigiendo ÚNICAMENTE los puntos señalados. ' +
      'Conserva lo que ya funcionaba. Respeta el límite de 120 palabras.',
    prompt:
      `BRIEFING ACTUAL:\n${draft}\n\n` +
      `CORRIGE ESTOS PUNTOS:\n${missing
        .map((m) => `  - ${JSON.stringify(m)}`)
        .join('\n')}\n\n` +
      `CONTEXTO:\n${context}`,
    onStepEnd: tracer.onStepFinish,
  });

  return revised;
}
