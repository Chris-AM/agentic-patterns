import vm from 'node:vm';

// TODO(B): desacoplar del caso; recibir `db` por parámetro.
import { HEROES } from '../data/heroes.js';
import { HOURS_PER_OPERATION } from '../data/mission.js';
import { VILLAINS } from '../data/villains.js';

// ---------------------------------------------------------------------------
// EL SANDBOX — la parte que NO es opcional
// ---------------------------------------------------------------------------
/**
 * `node:vm` aísla el ÁMBITO, no el PROCESO.
 * La documentación de Node lo dice: no es un mecanismo de seguridad.
 * Referencia: https://safeguard.sh/resources/blog/security-concerns-of-using-the-nodejs-vm-module-as-a-sandbox
 * Lo usamos aquí porque es cero dependencias y suficiente para el laboratorio.
 * En producción: worker aislado, contenedor efímero sin red, o un runtime
 * como isolated-vm / Deno con permisos denegados por defecto.
 *
 */
export type SandboxResult = {
  ok: boolean;
  value?: unknown;
  logs: string[];
  error?: string;
};

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

//! Obligatorio: el código debe recibir siempre un timeoutMs para 
//! evitar que el modelo se quede colgado indefinidamente y
//! terminar con un return
export function runInSandbox(code: string, timeoutMs = 1_000): SandboxResult {
  const logs: string[] = [];
  console.log(code.purple);

  const sandbox = {
    db: deepFreeze({
      villains: structuredClone(VILLAINS),
      heroes: structuredClone(HEROES),
      hoursPerOperation: HOURS_PER_OPERATION,
    }),
    console: {
      log: (...args: unknown[]) =>
        logs.push(args.map((a) => String(a)).join(' ')),
    },
  };

  try {
    const context = vm.createContext(sandbox);

    // El wrapper permite que el código del modelo use `return`.
    // vm.Script crea un objeto script compilado a partir del código fuente proporcionado.
    // Permite luego ejecutar ese código en un contexto seguro (sandbox) con runInContext.
    // Aquí, envolvemos el código del usuario/modelo en una función autoinvocada para permitir "return".
    const script = new vm.Script(`(function () {\n${code}\n})()`);
    const value = script.runInContext(context, { timeout: timeoutMs });

    return { ok: true, value, logs };
  } catch (error) {
    return { ok: false, logs, error: (error as Error).message };
  }
}
