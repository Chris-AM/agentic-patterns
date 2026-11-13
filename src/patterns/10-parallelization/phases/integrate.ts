import { generateText } from 'ai';

import { composeInstructions, type PhaseContext } from './context.js';
import type { ToolOutput } from './run-worker.js';

// ----- Fase 3: la integración ----------------------------------------------

export type Finding = { topic: string; subject: string; notes: string; data: ToolOutput[] };

/** Regla del mecanismo: una sola respuesta, sin repetir lo que aparece en varios temas. */
const INTEGRATE_RULES =
  'Integra los hallazgos de todos los temas en una sola respuesta. ' +
  'Si un mismo elemento aparece en varios temas, menciónalo una sola vez. ' +
  'Los `data` de cada tema son la fuente de verdad (salidas literales de las herramientas); ' +
  'si las `notes` los contradicen, manda el dato. ' +
  'Si recibes datos consolidados por el sistema, úsalos como base: ya están deduplicados. ' +
  'Si hay temas faltantes, decláralos explícitamente: no afirmes que no hay resultados para ellos.';

/** Lo que el sistema agrega por código: el consolidado y los temas que fallaron. */
export type IntegrateExtras = { consolidated?: unknown; missing?: string[] };

export async function integrate(
  ctx: PhaseContext,
  request: string,
  findings: Finding[],
  { consolidated, missing = [] }: IntegrateExtras = {}
) {
  const { text } = await generateText({
    model: ctx.model,
    instructions: composeInstructions(ctx.prompts.integrator, INTEGRATE_RULES, ctx.facts),
    prompt:
      `Petición original: ${request} \n\n` +
      'Hallazgos por tema: \n' +
      JSON.stringify(findings) +
      (consolidated === undefined
        ? ''
        : `\n\nDatos consolidados por el sistema (fuente de verdad, deduplicados): \n${JSON.stringify(consolidated)}`) +
      (missing.length ? `\n\nTemas faltantes (sin datos, decláralos): ${missing.join(', ')}` : ''),
    // findings
    //   .map((item) => `--- ${item.topic} --- \n ${item.findings}`)
    //   .join('\n\n'),
    onStepEnd: ctx.tracer.onStepFinish,
  });

  return text;
}
