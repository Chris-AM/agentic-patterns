import type { PhasePrompts } from '../phases/context.js';

// ---------------------------------------------------------------------------
// PROMPTS DEL CASO — newsletter de videojuegos
// ---------------------------------------------------------------------------
// Solo el rol y las reglas propias del caso (idioma, formato, largo). La regla
// de cada mecanismo vive en su fase y se compone con esto.

export const VIDEOGAME_PROMPTS: PhasePrompts = {
  planner: 'Eres el planificador de una newsletter de videojuegos. Responde en español.',
  worker:
    'Eres un investigador de videojuegos. Responde con una lista breve: título, ' +
    'fecha y una frase de por qué importa. Responde en español.',
  integrator:
    'Eres editor de una newsletter de videojuegos. Escribe un repaso de máximo ' +
    '200 palabras e indica las plataformas de cada juego. Responde en español.',
};

/** Ronda A: un solo agente que busca y redacta. */
export const SINGLE_AGENT_INSTRUCTIONS =
  'Eres redactor de una newsletter de videojuegos. Consulta la ' +
  'herramienta para cada plataforma que te pidan y redacta un repaso ' +
  'de máximo 200 palabras con los 2 lanzamientos más relevantes de ' +
  'cada una. Responde en español.';
