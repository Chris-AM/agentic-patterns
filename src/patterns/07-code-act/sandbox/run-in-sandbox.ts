import vm from 'node:vm';


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
// El techo lo exige el código: sin valor por defecto, y 0, negativos,
// Infinity o NaN lo desactivarían, así que se rechazan.
function assertTimeout(timeoutMs: number) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError(
      `timeoutMs debe ser un número finito mayor que 0 (recibido: ${timeoutMs})`
    );
  }
}

// `db` lo define el caso: el sandbox recibe una copia congelada y el
// original queda intacto.
export function runInSandbox(
  code: string,
  db: object,
  timeoutMs: number
): SandboxResult {
  assertTimeout(timeoutMs);
  const logs: string[] = [];
  console.log(code.purple);

  const sandbox = {
    db: deepFreeze(structuredClone(db)),
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
    // 'use strict': sin modo estricto, escribir sobre un dato congelado falla en
    // silencio y el modelo no se entera. En estricto lanza un error visible.
    const script = new vm.Script(`(function () {\n'use strict';\n${code}\n})()`);
    const value = script.runInContext(context, { timeout: timeoutMs });

    return { ok: true, value, logs };
  } catch (error) {
    return { ok: false, logs, error: (error as Error).message };
  }
}
