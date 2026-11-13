import { generateText } from 'ai';

import { createTracer, model } from '../../../helpers/index.js';
import { RESEARCH_REQUEST } from '../data/research-request.js';

// ----- Fase 3: la integración ----------------------------------------------

export async function integrateFindings(
  findings: { topic: string; findings: string }[],
  tracer: ReturnType<typeof createTracer>
) {
  const { text } = await generateText({
    model,
    instructions:
      'Eres editor de una newsletter de videojuegos. Integra los hallazgos ' +
      'en un repaso de máximo 200 palabras. Si un juego aparece en varios ' +
      'temas, menciónalo UNA sola vez indicando todas sus plataformas. ' +
      'Responde en español.',
    prompt:
      `Petición original: ${RESEARCH_REQUEST} \n\n` +
      'Hallazgos por tema: \n' +
      JSON.stringify(findings),
    // findings
    //   .map((item) => `--- ${item.topic} --- \n ${item.findings}`)
    //   .join('\n\n'),
    onStepEnd: tracer.onStepFinish,
  });

  return text;
}
