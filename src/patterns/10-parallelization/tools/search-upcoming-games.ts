import { tool } from 'ai';
import { z } from 'zod';

import { WINDOW_DAYS } from '../data/research-request.js';

// ---------------------------------------------------------------------------
// LA HERRAMIENTA DE BÚSQUEDA — una sola, genérica
// ---------------------------------------------------------------------------

export const RAWG_API_KEY = process.env.RAWG_API_KEY ?? '';

/** Techo de la llamada HTTP: una API lenta no debe colgar al worker. */
const RAWG_TIMEOUT_MS = 5_000;

/**
 * IDs de plataforma padre en RAWG. Verifícalos con:
 * GET https://api.rawg.io/api/platforms/lists/parents?key=...
 */
export const PLATFORMS = {
  pc: 1,
  playstation: 2,
  xbox: 3,
  nintendo: 7,
} as const;

export type Platform = keyof typeof PLATFORMS;

export const searchUpcomingGames = tool({
  description:
    'Busca los videojuegos que salen en una plataforma dentro de una ' +
    'ventana de días, ordenados por expectación. Úsala antes de responder: ' +
    'no inventes títulos ni fechas.',
  inputSchema: z.object({
    // Derivado de PLATFORMS: agregar una plataforma no exige tocar el schema.
    platform: z.enum(Object.keys(PLATFORMS) as [Platform, ...Platform[]]),
    days: z.number().min(1).max(365).default(WINDOW_DAYS),
    limit: z.number().min(3).max(20).default(10),
  }),
  execute: async ({ platform, days, limit }) => {
    const from = new Date();
    const to = new Date(from.getTime() + days * 86_400_000);
    const iso = (date: Date) => date.toISOString().slice(0, 10);

    const params = new URLSearchParams({
      key: RAWG_API_KEY,
      dates: `${iso(from)},${iso(to)}`,
      parent_platforms: String(PLATFORMS[platform as Platform]),
      ordering: '-added',
      page_size: String(limit),
    });

    // Errores de red o timeout vuelven como observación (lección de ReAct), no como excepción.
    let response: Response;
    try {
      response = await fetch(`https://api.rawg.io/api/games?${params}`, {
        signal: AbortSignal.timeout(RAWG_TIMEOUT_MS),
      });
    } catch (error) {
      return { error: `No se pudo consultar RAWG: ${(error as Error).message}` };
    }
    if (!response.ok) return { error: `RAWG respondió ${response.status}` };

    const data = (await response.json()) as {
      results: { name: string; released: string | null; added: number }[];
    };

    return {
      platform,
      games: data.results
        .filter((game) => game.released)
        .map((game) => ({
          title: game.name,
          released: game.released,
          hype: game.added,
        })),
    };
  },
});
