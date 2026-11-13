import { generateText, stepCountIs } from 'ai';

import { createTracer, model } from '../../../helpers/index.js';
import { DEPARTMENTS, type Department } from '../data/departments.js';

// ---------------------------------------------------------------------------
// EL WORKER — un departamento atendiendo una tarea (especialista)
// ---------------------------------------------------------------------------

export async function runWorker(
  department: Department,
  task: string,
  tracer: ReturnType<typeof createTracer>
) {
  const config = DEPARTMENTS[department];

  const { text } = await generateText({
    model,
    instructions: config.instructions,
    prompt: task,
    stopWhen: stepCountIs(3),
    tools: config.tools,
    onStepEnd: tracer.onStepFinish,
  });

  return text.trim();
}
