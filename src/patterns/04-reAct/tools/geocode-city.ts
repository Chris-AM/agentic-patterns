import { tool } from 'ai';
import { z } from 'zod';

import { GEO_DATABASE } from '../data/geo-database.js';

// ---------------------------------------------------------------------------
// HERRAMIENTA 1 — geocodificar
// ---------------------------------------------------------------------------

export const geocodeCity = tool({
  description:
    'Convierte el nombre de una ciudad en coordenadas geográficas. ' +
    'Devuelve una única coincidencia.',
  inputSchema: z.object({
    city: z.string().describe('Nombre de la ciudad. ej: "Ottawa"'),
  }),
  execute: async ({ city }) => {
    console.log('Tool geocodeCity llamada - args:'.red, { city });
    const matches = GEO_DATABASE.filter(
      (m) => m.city.toLowerCase() === city.toLowerCase()
    );

    if (matches.length === 0) {
      return { error: `No se encontró ninguna ciudad llamada "${city}"` };
    }

    // ══════════════════════════════════════════════════════════════════
    //  EL INTERRUPTOR
    //
    //  Esta herramienta NO acepta país. No se puede desambiguar desde
    //  aquí, por muy claro que el usuario haya dicho "la capital de
    //  Canadá": devuelve siempre la primera coincidencia del índice,
    //  que aquí NO es la más poblada.
    //
    //  Ese es el punto: el dato correcto NO está al alcance de la
    //  primera acción. Solo se llega a él ejecutando una acción
    //  DISTINTA (listCityMatches), y para eso hay que haber leído el
    //  aviso. Reintentar esta misma llamada no cambiaría nada.
    // ══════════════════════════════════════════════════════════════════
    const first = matches[0];

    return {
      resolved: first,
      warning:
        `Hay ${matches.length} ciudades llamadas "${city}" en el índice. ` +
        'Se devolvió la primera, que puede no ser la que buscas. ' +
        'Usa listCityMatches para ver todas y elegir.',
      alternativesAvailable: matches.length - 1,
    };
  },
});
