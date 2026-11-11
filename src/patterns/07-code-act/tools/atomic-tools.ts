import { tool } from 'ai';
import { z } from 'zod';

import { toolResultsOf } from '../../../helpers/tool-results.js';
import { HEROES } from '../data/heroes.js';
import type { Plan } from '../data/plan-checks.js';
import { VILLAINS } from '../data/villains.js';

// ---------------------------------------------------------------------------
// A) SIN CODEACT — herramientas atómicas, una acción JSON por dato
// ---------------------------------------------------------------------------
/**
 * El detalle clave: `getNextVillain`
 * solo permite avanzar elemento por elemento usando el cursor que entrega cada llamada.
 *
 * ¿Qué implica esto? El agente únicamente puede avanzar paso a paso usando el cursor proporcionado,
 * sin saber cuántos elementos hay por adelantado ni acceder directamente a cualquier elemento de la lista.
 * No puede, por ejemplo:
 *     - Pedir el villano #7 sin antes haber pasado por los seis anteriores; siempre debe usar el valor devuelto por la llamada previa.
 *     - No es posible pedir el villano #7 sin haber solicitado antes el #6.
 *
 * Esto elimina la posibilidad de llamadas en paralelo. El modelo está
 * obligado a gastar un paso por villano. 12 villanos + 5 héroes +
 * 12 asignaciones ≈ 30 pasos mínimos, y el presupuesto son 10.
 *
 * No falla "a veces". No puede terminar ya que es matemáticamente imposible.
 */

/**
 * * buildAtomicTools es necesaria para obligar al modelo a recorrer los datos uno por uno.
 *
 * Provee:
 *   - Las tres "herramientas" mínimas que el modelo puede invocar (con restricciones de acceso/economía de pasos).
 *   - El plan ya no se acumula aquí: se reconstruye desde la traza con planFromSteps (mejora C).
 *
 * Esto es clave para ilustrar las limitaciones del JSON puro frente al enfoque code-act.
 */
export function buildAtomicTools() {
  // Herramienta para obtener villanos de a uno, sólo avanzando con el cursor previo.
  const getNextVillain = tool({
    description:
      'Devuelve UN villano y el cursor para pedir el siguiente. ' +
      'Empieza con cursor "start". Cuando nextCursor sea null, terminaste.',
    inputSchema: z.object({
      cursor: z
        .string()
        .describe('"start" o el nextCursor de la llamada previa'),
    }),
    execute: async ({ cursor }) => {
      const index = cursor === 'start' ? 0 : Number(cursor.replace('vln-', ''));
      const villain = VILLAINS[index];

      if (!villain) return { villain: null, nextCursor: null };

      return {
        villain,
        nextCursor: index + 1 < VILLAINS.length ? `vln-${index + 1}` : null,
      };
    },
  });

  // Herramienta para obtener héroes de a uno, sólo avanzando con el cursor previo.
  const getNextHero = tool({
    description:
      'Devuelve UN héroe y el cursor para pedir el siguiente. ' +
      'Empieza con cursor "start".',
    inputSchema: z.object({ cursor: z.string() }),
    execute: async ({ cursor }) => {
      const index = cursor === 'start' ? 0 : Number(cursor.replace('hro-', ''));
      const hero = HEROES[index];

      if (!hero) return { hero: null, nextCursor: null };

      return {
        hero,
        nextCursor: index + 1 < HEROES.length ? `hro-${index + 1}` : null,
      };
    },
  });

  // Herramienta para registrar la asignación de un héroe a un villano.
  // Mejora C: no muta estado externo. Valida y devuelve un valor; el registro
  // queda en la traza (result.steps), que es la única fuente de verdad.
  const assignHero = tool({
    description: 'Registra la asignación de UN villano a UN héroe.',
    inputSchema: z.object({
      heroAlias: z.string(),
      villainAlias: z.string(),
    }),
    execute: async ({ heroAlias, villainAlias }) =>
      validateAssignment(heroAlias, villainAlias),
  });

  return { getNextVillain, getNextHero, assignHero };
}

/** Rechaza alias inventados en el momento de la llamada, no recién en la auditoría. */
export function validateAssignment(heroAlias: string, villainAlias: string) {
  if (!HEROES.some((hero) => hero.alias === heroAlias)) {
    return { registered: false, error: `No existe el héroe "${heroAlias}".` };
  }
  if (!VILLAINS.some((villain) => villain.alias === villainAlias)) {
    return { registered: false, error: `No existe el villano "${villainAlias}".` };
  }
  return { registered: true };
}

/**
 * Reconstruye el plan a partir de la traza (reemplaza a toPlan + collected).
 * Solo cuenta las asignaciones aceptadas y la primera por villano, así un
 * reintento de la misma llamada no duplica la asignación.
 */
export function planFromSteps(
  steps: Parameters<typeof toolResultsOf>[0]
): Plan {
  const assignments: Record<string, string[]> = {};
  const seen = new Set<string>();

  for (const { input, output } of toolResultsOf(steps, 'assignHero')) {
    const { heroAlias, villainAlias } = input as {
      heroAlias: string;
      villainAlias: string;
    };
    if (!(output as { registered: boolean }).registered) continue;
    if (seen.has(villainAlias)) continue;

    seen.add(villainAlias);
    (assignments[heroAlias] ??= []).push(villainAlias);
  }

  return { assignments, unhandled: [] };
}
