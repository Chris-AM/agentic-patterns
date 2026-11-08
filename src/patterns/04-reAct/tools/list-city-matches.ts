import { tool } from 'ai';
import { z } from 'zod';

import { GEO_DATABASE } from '../data/geo-database.js';

// ---------------------------------------------------------------------------
// HERRAMIENTA 2 — la salida del laberinto
// ---------------------------------------------------------------------------
// Solo tiene sentido llamarla DESPUÉS de haber observado el aviso.
// Es la acción correctiva: distinta, no una repetición.

export const listCityMatches = tool({
  description:
    'Lista TODAS las ciudades que comparten un mismo nombre, con su ' +
    'región, país y coordenadas. Úsala cuando geocodeCity avise de ' +
    'varias coincidencias y necesites elegir la correcta.',
  inputSchema: z.object({
    city: z.string().describe('Nombre de la ciudad. ej: "Ottawa"'),
  }),
  execute: async ({ city }) => {
    console.log('Tool listCityMatches llamada - args:'.red, { city });
    const matches = GEO_DATABASE.filter(
      (m) => m.city.toLowerCase() === city.toLowerCase()
    );

    if (matches.length === 0) {
      return { error: `No se encontró ninguna ciudad llamada "${city}"` };
    }

    return { count: matches.length, matches };
  },
});
