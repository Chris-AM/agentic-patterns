/**
 * Lee los resultados de una tool desde la traza de generateText (`result.steps`).
 * La traza es la única fuente de verdad de lo que hizo el modelo: las tools
 * devuelven valores y nadie acumula estado en una variable externa.
 */
type StepLike = {
  toolResults: ReadonlyArray<{ toolName: string; input: unknown; output: unknown }>;
};

export function toolResultsOf(steps: ReadonlyArray<StepLike>, toolName: string) {
  return steps
    .flatMap((step) => step.toolResults)
    .filter((result) => result.toolName === toolName);
}

/** Nombres de las tools que se ejecutaron (no solo invocadas), en orden. */
export function toolNamesOf(steps: ReadonlyArray<StepLike>) {
  return steps.flatMap((step) => step.toolResults).map((result) => result.toolName);
}
