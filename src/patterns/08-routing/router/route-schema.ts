import { z } from 'zod';

// ---------------------------------------------------------------------------
// CONFIGURACIÓN DEL ROUTER — la define la instancia, la verifica el núcleo
// ---------------------------------------------------------------------------
/**
 * Sin fallback, `z.enum` obliga a elegir una categoría aunque el mensaje sea
 * ambiguo o fuera de dominio. El núcleo exige que exista una ruta de escape;
 * la instancia define su nombre, su descripción y el rol del router.
 */
export type Fallback<F extends string> = { route: F; description: string };

export type RouterConfig<T extends string, F extends string> = {
  /** Quién es el router en esta instancia (centralita, recepción, mesa de ayuda…). */
  role: string;
  /** Rutas disponibles → descripción. Deben ser disjuntas. */
  categories: Record<T, string>;
  fallback: Fallback<F>;
};

export function buildRouteSchema<T extends string, F extends string>({
  categories,
  fallback,
}: RouterConfig<T, F>) {
  const names = Object.keys(categories) as (T | F)[];

  if (names.includes(fallback.route)) {
    throw new Error(
      `La ruta de fallback "${fallback.route}" no puede llamarse igual que una categoría.`
    );
  }

  const routes: (T | F)[] = [...names, fallback.route];

  return z.object({
    route: z.enum(routes as [T | F, ...(T | F)[]]),
    reason: z.string().describe('Una frase del por qué'),
  });
}

export function routerInstructions<T extends string, F extends string>({
  role,
  categories,
  fallback,
}: RouterConfig<T, F>) {
  return (
    `${role}\nElige UNA sola ruta:\n` +
    Object.entries<string>(categories)
      .map(([name, description]) => ` - ${name}: ${description}`)
      .join('\n') +
    `\n - ${fallback.route}: ${fallback.description}` +
    `\nSi el mensaje no encaja con claridad en una sola ruta, elige "${fallback.route}".`
  );
}
