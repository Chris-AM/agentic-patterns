import { generateText } from 'ai';

import { composeInstructions, type PhaseContext } from './context.js';

// ----- Fase 3: la integración ----------------------------------------------

export type Finding = { topic: string; findings: string };

/** Regla del mecanismo: una sola respuesta, sin repetir lo que aparece en varios temas. */
const INTEGRATE_RULES =
  'Integra los hallazgos de todos los temas en una sola respuesta. ' +
  'Si un mismo elemento aparece en varios temas, menciónalo una sola vez.';

export async function integrate(ctx: PhaseContext, request: string, findings: Finding[]) {
  const { text } = await generateText({
    model: ctx.model,
    instructions: composeInstructions(ctx.prompts.integrator, INTEGRATE_RULES),
    prompt:
      `Petición original: ${request} \n\n` +
      'Hallazgos por tema: \n' +
      JSON.stringify(findings),
    // findings
    //   .map((item) => `--- ${item.topic} --- \n ${item.findings}`)
    //   .join('\n\n'),
    onStepEnd: ctx.tracer.onStepFinish,
  });

  return text;
}
