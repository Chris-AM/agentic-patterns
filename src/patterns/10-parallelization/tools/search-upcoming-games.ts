import { tool } from 'ai';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// LA HERRAMIENTA DE BÚSQUEDA — una sola, genérica
// ---------------------------------------------------------------------------

export const RAWG_API_KEY = process.env.RAWG_API_KEY ?? '';

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
    platform: z.enum(['pc', 'playstation', 'xbox', 'nintendo']),
    days: z.number().min(1).max(365).default(90),
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

    const response = await fetch(`https://api.rawg.io/api/games?${params}`);
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
