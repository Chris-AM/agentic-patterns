import { generateText } from 'ai';

import { createTracer, model } from '../../../helpers/index.js';
import { BRIEF, WRITER_INSTRUCTIONS } from '../data/announcement.js';

// ---------------------------------------------------------------------------
// LOS ESLABONES
// ---------------------------------------------------------------------------

/** Eslabón 2 — el recorte. Recibe el veredicto del gate, no algo vago. */
// Eventualmente lo puliremos para que sea más robusto y eficiente.
export async function updateAnnouncement(
  text: string, // anuncio actual
  feedback: string, // feedback del gate
  tracer: ReturnType<typeof createTracer>
) {
  const { text: newText } = await generateText({
    model,
    instructions: WRITER_INSTRUCTIONS,
    prompt:
      `ANUNCIO ACTUAL: \n---${text}---` +
      `\nPROBLEMA: \n${feedback} ---` +
      //* Prevenir el degradado eventualmente
      `\n\nPrompt original: ${BRIEF}---`,
    onStepEnd: tracer.onStepFinish,
  });

  return newText.trim();
}
