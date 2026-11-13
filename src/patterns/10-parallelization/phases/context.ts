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
};

/** Rol del caso + regla del mecanismo, en ese orden. */
export const composeInstructions = (role: string, rules: string) => `${role}\n${rules}`;
