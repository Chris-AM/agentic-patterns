import { tool } from 'ai';
import { z } from 'zod';

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
 *   - Un mecanismo (toPlan) para reconstruir a posteriori el plan generado, en base a las asignaciones realizadas.
 *
 * Esto es clave para ilustrar las limitaciones del JSON puro frente al enfoque code-act.
 */
export function buildAtomicTools() {
  // Lista de asignaciones realizadas por el modelo, usada para reconstruir el plan.
  const collected: Array<{ hero: string; villain: string }> = [];
  // [
  //   { hero: "Iron Man", villain: "Thanos" },
  //   { hero: "Spider-Man", villain: "Mysterio" },
  //   { hero: "Captain America", villain: "Red Skull" },
  // ]

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
  const assignHero = tool({
    description: 'Registra la asignación de UN villano a UN héroe.',
    inputSchema: z.object({
      heroAlias: z.string(),
      villainAlias: z.string(),
    }),
    execute: async ({ heroAlias, villainAlias }) => {
      collected.push({ hero: heroAlias, villain: villainAlias });
      return { registered: true, total: collected.length };
    },
  });

  // Expone las herramientas para el agente y el método para reconstruir el plan final.
  return {
    tools: { getNextVillain, getNextHero, assignHero },
    // El objetivo de este método toPlan es reconstruir el "plan" final a partir de las asignaciones registradas en el arreglo `collected`.
    // Recorre todas las entradas de asignaciones y agrupa los villanos asignados a cada héroe en un objeto.
    // Devuelve un objeto con dicha agrupación y un array vacío para "unhandled".
    toPlan(): Plan {
      const assignments: Record<string, string[]> = {};

      for (const entry of collected) {
        (assignments[entry.hero] ??= []).push(entry.villain);
      }

      return { assignments, unhandled: [] };
    },
  };
}
