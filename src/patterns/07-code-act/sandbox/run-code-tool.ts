import { tool } from 'ai';
import { z } from 'zod';

import { extractCode } from './extract-code.js';
import { runInSandbox } from './run-in-sandbox.js';

// ---------------------------------------------------------------------------
// NÚCLEO DE CODEACT — la tool que actúa como intérprete
// ---------------------------------------------------------------------------
/**
 * El mecanismo no sabe nada del caso. El caso le inyecta:
 *   - db: los datos que el código puede leer (copia congelada).
 *   - timeoutMs: el techo de cada ejecución (lo define la instancia).
 *   - validate: el juez del caso; devuelve las etiquetas de los checks fallidos.
 *   - failureHint: la pista del caso cuando el resultado no es válido.
 *
 * El ciclo de retroalimentación (ok / error / failedChecks / hint) es del
 * núcleo: cualquier caso recibe las mismas observaciones.
 */
export type RunCodeOptions = {
  db: object;
  timeoutMs: number;
  validate: (value: unknown) => string[];
  failureHint: string;
};

export type RunCodeOutput = {
  ok: boolean;
  logs: string[];
  value?: unknown;
  error?: string;
  failedChecks?: string[];
  hint: string;
};

/** Deriva la forma de `db` desde los datos: única fuente de verdad. */
export function describeDb(db: object): string {
  return Object.entries(db)
    .map(([key, value]) => {
      const shape =
        Array.isArray(value) && value[0] && typeof value[0] === 'object'
          ? `[{ ${Object.keys(value[0]).join(', ')} }]`
          : typeof value;
      return `  db.${key} → ${shape}`;
    })
    .join('\n');
}

/** Ejecuta una acción de código y la convierte en observación. Función pura salvo el sandbox. */
export function runCodeAction(code: string, options: RunCodeOptions): RunCodeOutput {
  const result = runInSandbox(extractCode(code), options.db, options.timeoutMs);

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      logs: result.logs,
      hint: 'El código lanzó una excepción. Corrígelo y vuelve a ejecutar.',
    };
  }

  const failed = options.validate(result.value);

  return {
    ok: failed.length === 0,
    logs: result.logs,
    value: result.value,
    failedChecks: failed,
    hint: failed.length
      ? `El resultado NO es válido. Fallan: ${failed.join(' | ')}. ${options.failureHint}`
      : 'Resultado válido.',
  };
}

export function buildRunCodeTool(options: RunCodeOptions) {
  return tool({
    description:
      'Ejecuta código JavaScript en un sandbox y devuelve lo que retornes. ' +
      'Dentro dispones de:\n' +
      describeDb(options.db) +
      '\nUsa `return` para devolver el resultado. Sin await, sin require, ' +
      'sin acceso a red ni a ficheros.',
    inputSchema: z.object({
      code: z
        .string()
        .describe('Código JavaScript. Debe de terminar con un return.'),
    }),
    execute: async ({ code }) => runCodeAction(code, options),
  });
}
