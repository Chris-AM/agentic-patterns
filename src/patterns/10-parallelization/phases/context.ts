import type { GenerateTextStepEndEvent, LanguageModel, ToolSet } from 'ai';

// ---------------------------------------------------------------------------
// CONTEXTO DE LAS FASES — lo estable de la instancia, inyectado una sola vez
// ---------------------------------------------------------------------------

/** Interfaz mínima del tracer: las fases solo necesitan avisar cada paso. */
export type StepObserver = {
  onStepFinish: (event: GenerateTextStepEndEvent) => void;
};

/** Roles del caso. La regla del mecanismo la agrega cada fase. */
export type PhasePrompts = {
  planner: string;
  worker: string;
  integrator: string;
};

/** Techos del mecanismo: el núcleo los exige, la instancia define el valor. */
export type PhaseLimits = {
  maxTasks: number;
  workerSteps: number;
};

export type PhaseContext = {
  model: LanguageModel;
  tracer: StepObserver;
  limits: PhaseLimits;
  prompts: PhasePrompts;
  /** Tools de los workers (las del caso). */
  tools: ToolSet;
  /**
   * Eje de la descomposición que declara la instancia (plataformas,
   * contratos…). Cada tarea del plan trae uno: deja de ser texto interpretable.
   */
  subjects: readonly string[];
  /**
   * Hechos fijos que calcula el CÓDIGO una vez por corrida (hoy, ventana…).
   * Todas las fases reciben la misma referencia: el modelo no adivina el presente.
   */
  facts: Record<string, string>;
};

function formatFacts(facts: Record<string, string>) {
  const lines = Object.entries(facts).map(([key, value]) => `- ${key}: ${value}`);
  return lines.length
    ? `\nContexto fijo calculado por el sistema (úsalo tal cual, no lo supongas):\n${lines.join('\n')}`
    : '';
}

/** Rol del caso + regla del mecanismo + hechos fijos, en ese orden. */
export const composeInstructions = (
  role: string,
  rules: string,
  facts: Record<string, string>
) => `${role}\n${rules}${formatFacts(facts)}`;
