import type { ToolSet } from 'ai';

// ---------------------------------------------------------------------------
// ESPECIALISTAS — contrato genérico (sin modelo: se puede probar sin red)
// ---------------------------------------------------------------------------

export type Specialist = {
  /** Lo que lee el router para decidir la ruta. */
  description: string;
  /** Lo único que ve el especialista. */
  instructions: string;
  /** Sus tools: disjuntas con las de los demás especialistas. */
  tools: ToolSet;
};

/** Las categorías del router se derivan de las descripciones: única fuente de verdad. */
export function categoriesOf<T extends string>(specialists: Record<T, Specialist>) {
  return Object.fromEntries(
    Object.entries<Specialist>(specialists).map(([name, s]) => [name, s.description])
  ) as Record<T, string>;
}

/**
 * Une las tools de todos los especialistas (la caja del «todólogo»).
 * Si dos especialistas comparten una tool, lanza: la garantía «disjuntas»
 * la verifica el código, no un comentario.
 */
export function mergeTools(specialists: Record<string, Specialist>): ToolSet {
  const merged: ToolSet = {};

  for (const [name, specialist] of Object.entries(specialists)) {
    for (const [toolName, tool] of Object.entries(specialist.tools)) {
      if (toolName in merged) {
        throw new Error(`La tool "${toolName}" se repite en "${name}": deben ser disjuntas.`);
      }
      merged[toolName] = tool;
    }
  }

  return merged;
}

/** Techo de pasos del especialista: obligatorio, lo define la instancia. */
export function assertStepBudget(stepBudget: number) {
  if (!Number.isInteger(stepBudget) || stepBudget <= 0) {
    throw new RangeError(
      `stepBudget debe ser un entero mayor que 0 (recibido: ${stepBudget})`
    );
  }
}
