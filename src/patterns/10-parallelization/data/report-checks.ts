import type { CatalogEntry } from './game-catalog.js';

// ---------------------------------------------------------------------------
// EL JUEZ PROGRAMÁTICO — el informe contra los datos de la traza
// ---------------------------------------------------------------------------
/**
 * La integración junta, pero no verifica. Este juez sí:
 *   - Cobertura: cada plataforma con juegos tiene al menos un título.
 *   - El más esperado (mayor hype) de cada plataforma aparece.
 *   - Sin inventados: todo título en **negrita** existe en el catálogo.
 *   - Sin duplicados: ningún título en negrita se repite.
 *   - Faltantes declarados: si un worker falló, el informe lo dice.
 *
 * Límites conocidos:
 *   - «inventados» y «duplicados» dependen del contrato de formato (títulos
 *     en negrita). Si el modelo no lo respeta, pierden precisión.
 *   - «faltantes declarados» solo verifica que el tema se MENCIONE: si aparece
 *     por otro motivo (ej. «Xbox» como plataforma de un juego), pasa igual.
 * La cobertura no depende del formato.
 */
export type Check = { label: string; passed: boolean };

const boldTitles = (report: string) =>
  [...report.matchAll(/\*\*(.+?)\*\*/g)].map((match) => match[1]!.trim());

export function auditReport(
  report: string,
  catalog: CatalogEntry[],
  missing: string[] = []
): Check[] {
  const lower = report.toLowerCase();
  const mentions = (title: string) => lower.includes(title.toLowerCase());
  const platforms = [...new Set(catalog.flatMap((game) => game.platforms))];

  const checks: Check[] = platforms.flatMap((platform) => {
    const games = catalog.filter((game) => game.platforms.includes(platform));
    const top = games.reduce((best, game) => (game.hype > best.hype ? game : best));
    return [
      { label: `Cobertura ${platform}: al menos un título`, passed: games.some((g) => mentions(g.title)) },
      { label: `Lo más esperado de ${platform}: ${top.title}`, passed: mentions(top.title) },
    ];
  });

  const bold = boldTitles(report);
  const known = new Set(catalog.map((game) => game.title.toLowerCase()));
  const invented = bold.filter((title) => !known.has(title.toLowerCase()));
  const duplicated = bold.filter((title, i) => bold.indexOf(title) !== i);

  checks.push(
    { label: `Sin títulos inventados${invented.length ? ` (${invented.join(', ')})` : ''}`, passed: invented.length === 0 },
    { label: `Sin duplicados${duplicated.length ? ` (${duplicated.join(', ')})` : ''}`, passed: duplicated.length === 0 },
    {
      label: `Temas faltantes declarados${missing.length ? ` (${missing.join(', ')})` : ''}`,
      passed: missing.every((topic) => lower.includes(topic.toLowerCase())),
    }
  );

  return checks;
}

export function printAudit(checks: Check[]) {
  const passed = checks.filter((check) => check.passed).length;
  for (const check of checks) {
    console.log(`     ${check.passed ? '✓'.green : '✗'.red} ${check.label}`);
  }
  console.log(`     → ${passed}/${checks.length} verificaciones superadas`.blue);
  return `${passed}/${checks.length}`;
}
