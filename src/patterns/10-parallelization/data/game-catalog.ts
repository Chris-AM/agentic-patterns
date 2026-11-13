import type { Finding } from '../phases/integrate.js';

// ---------------------------------------------------------------------------
// CATÁLOGO CONSOLIDADO — la deduplicación la hace el CÓDIGO, no el modelo
// ---------------------------------------------------------------------------
/**
 * Junta las salidas de `searchUpcomingGames` de todos los workers. Un juego
 * multiplataforma aparece en varias ramas (los workers no se ven entre sí):
 * aquí queda como UNA entrada con todas sus plataformas. Agrupar y comparar
 * títulos es cuantitativo y exacto → código, no instrucción al modelo.
 */
export type CatalogEntry = {
  title: string;
  released: string;
  hype: number;
  platforms: string[];
};

type SearchOutput = {
  platform: string;
  games: { title: string; released: string; hype: number }[];
};

const isSearchOutput = (output: unknown): output is SearchOutput =>
  !!output && typeof output === 'object' && Array.isArray((output as SearchOutput).games);

export function buildCatalog(findings: Finding[]): CatalogEntry[] {
  const byTitle = new Map<string, CatalogEntry>();

  for (const { toolName, output } of findings.flatMap((finding) => finding.data)) {
    if (toolName !== 'searchUpcomingGames' || !isSearchOutput(output)) continue;

    for (const game of output.games) {
      const entry = byTitle.get(game.title) ?? { ...game, platforms: [] };
      if (!entry.platforms.includes(output.platform)) entry.platforms.push(output.platform);
      entry.hype = Math.max(entry.hype, game.hype);
      byTitle.set(game.title, entry);
    }
  }

  return [...byTitle.values()].sort((a, b) => b.hype - a.hype);
}
