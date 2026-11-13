import { model as defaultModel } from '../../../helpers/index.js';
import type { PhaseContext } from './context.js';
import { integrate, type Finding } from './integrate.js';
import { plan } from './plan.js';
import { runWorker } from './run-worker.js';

// ---------------------------------------------------------------------------
// FÁBRICA DE FASES — el contexto se inyecta UNA vez, en la composición
// ---------------------------------------------------------------------------
/**
 * Va en la configuración lo estable de la instancia (tracer, límites,
 * prompts del caso, tools y, opcionalmente, el modelo). Va en cada llamada
 * lo que cambia por ejecución (la petición, los hallazgos).
 *
 * `model` es opcional: por defecto el de helpers; en las pruebas, uno simulado.
 */
export type PhasesConfig = Omit<PhaseContext, 'model'> & {
  model?: PhaseContext['model'];
};

function assertPositiveInteger(name: string, value: number) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} debe ser un entero mayor que 0 (recibido: ${value})`);
  }
}

export function createPhases(config: PhasesConfig) {
  // Falla al crearse, no a mitad de una corrida.
  assertPositiveInteger('limits.maxTasks', config.limits.maxTasks);
  assertPositiveInteger('limits.workerSteps', config.limits.workerSteps);

  const ctx: PhaseContext = { ...config, model: config.model ?? defaultModel };

  return {
    plan: (request: string) => plan(ctx, request),
    runWorker: (assignment: string) => runWorker(ctx, assignment),
    integrate: (request: string, findings: Finding[]) => integrate(ctx, request, findings),
  };
}
