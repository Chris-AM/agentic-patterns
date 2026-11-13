import { generateText, stepCountIs } from 'ai';

import { createTracer, model } from '../../../helpers/index.js';
import { searchUpcomingGames } from '../tools/search-upcoming-games.js';

// ----- Fase 2: el worker ---------------------------------------------------

/**
 * Un sub-agente con la herramienta de búsqueda y un encargo.
 * Devuelve texto. Es el mismo runWorker que en los labs anteriores.
 */
export async function runWorker(
  assignment: string,
  tracer: ReturnType<typeof createTracer>
) {
  const { text } = await generateText({
    model,
    tools: { searchUpcomingGames },
    stopWhen: stepCountIs(4),
    instructions:
      'Eres un investigador de videojuegos. Cumple tu encargo consultando ' +
      'la herramienta y responde con una lista breve: título, fecha y una ' +
      'frase de por qué importa. Copia títulos y fechas literalmente. ' +
      'Responde en español.',
    prompt: assignment,
    onStepEnd: tracer.onStepFinish,
  });

  return text;
}
