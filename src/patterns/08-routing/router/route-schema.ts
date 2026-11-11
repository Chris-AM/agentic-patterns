import { z } from 'zod';

// ---------------------------------------------------------------------------
// FALLBACK — el router siempre tiene una salida para lo que no calza
// ---------------------------------------------------------------------------
/**
 * Sin fallback, `z.enum` obliga a elegir una categoría aunque la llamada sea
 * ambigua o fuera de dominio. El núcleo exige que exista una ruta de escape;
 * la instancia define su nombre y su descripción.
 */
export type Fallback<F extends string> = { route: F; description: string };

export function buildRouteSchema<T extends string, F extends string>(
  categories: Record<T, string>,
  fallback: Fallback<F>
) {
  const names = Object.keys(categories) as (T | F)[];

  if (names.includes(fallback.route)) {
    throw new Error(
      `La ruta de fallback "${fallback.route}" no puede llamarse igual que una categoría.`
    );
  }

  const routes: (T | F)[] = [...names, fallback.route];

  return z.object({
    department: z.enum(routes as [T | F, ...(T | F)[]]),
    reason: z.string().describe('Una frase del por qué'),
  });
}

export function routerInstructions<T extends string, F extends string>(
  categories: Record<T, string>,
  fallback: Fallback<F>
) {
  return (
    'Eres un centralista. Transfiere la llamada a UN solo departamento: \n' +
    Object.entries<string>(categories)
      .map(([name, description]) => ` - ${name}: ${description}`)
      .join('\n') +
    `\n - ${fallback.route}: ${fallback.description}` +
    `\nSi la llamada no encaja con claridad en un solo departamento, elige "${fallback.route}".`
  );
}
