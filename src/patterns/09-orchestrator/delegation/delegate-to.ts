import { tool } from 'ai';
import { z } from 'zod';

import { createTracer } from '../../../helpers/index.js';
import { DEPARTMENTS, type Department } from '../data/departments.js';
import { runWorker } from '../workers/run-worker.js';

/**
 * Cada herramienta del orquestador ES un departamento completo: por dentro
 * ejecuta el worker con su propia tool y sus propias instrucciones.
 */
export function delegateTo(
  department: Department,
  tracer: ReturnType<typeof createTracer>
) {
  const config = DEPARTMENTS[department];

  return tool({
    description: `Delega una tarea al departamento de ${department}: ${config.description}`,
    inputSchema: z.object({
      task: z
        .string()
        .describe('Instrucción concreta para el departamento. En una frase. '),
    }),
    execute: async ({ task }) => {
      console.log(`\n   -> Orchestrator delega a ${department}: ${task}`.blue);
      const result = await runWorker(department, task, tracer);
      console.log(`     ${department}: ${result}`.green);

      return { department, result };
    },
  });
}
