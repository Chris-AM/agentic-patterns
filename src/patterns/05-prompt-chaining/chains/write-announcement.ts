import { generateText } from 'ai';

import { createTracer, model } from '../../../helpers/index.js';
import { BRIEF, WRITER_INSTRUCTIONS } from '../data/announcement.js';

// ---------------------------------------------------------------------------
// LOS ESLABONES
// ---------------------------------------------------------------------------

/** Eslabón 1 — el borrador. */
export async function writeAnnouncement(tracer: ReturnType<typeof createTracer>) {
  const { text } = await generateText({
    model,
    instructions: WRITER_INSTRUCTIONS,
    prompt: BRIEF,
    onStepEnd: tracer.onStepFinish,
  });

  return text.trim();
}
