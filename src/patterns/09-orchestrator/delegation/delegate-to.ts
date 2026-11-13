import { tool } from 'ai';
import { z } from 'zod';

import { createTracer } from '../../../helpers/index.js';
import { DEPARTMENT_NAMES, DEPARTMENTS, type Department } from '../data/departments.js';
import { runWorker } from '../workers/run-worker.js';

type DelegationOptions = { stepBudget: number; tracer: ReturnType<typeof createTracer> };

/**
 * Cada herramienta del orquestador ES un departamento completo: por dentro
 * ejecuta el worker con su propia tool y sus propias instrucciones.
 */
export function delegateTo(department: Department, options: DelegationOptions) {
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
      const { text, issuedIds } = await runWorker(department, task, options);
      console.log(`     ${department}: ${text}`.green);

      // issuedIds viaja en la salida: el juez lo lee de la traza del orquestador.
      return { department, result: text, issuedIds };
    },
  });
}

const toolNameOf = (department: Department) =>
  `delegateTo${department[0]!.toUpperCase()}${department.slice(1)}`;

/** Una tool de delegación por departamento, derivada de DEPARTMENTS (mejora 4). */
export function delegationTools(options: DelegationOptions) {
  return Object.fromEntries(
    DEPARTMENT_NAMES.map((department) => [toolNameOf(department), delegateTo(department, options)])
  );
}
