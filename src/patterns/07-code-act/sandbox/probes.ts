// ---------------------------------------------------------------------------
// C) EL PRECIO DEL PATRÓN — por qué `node:vm` no basta
// ---------------------------------------------------------------------------
/**
 * Estas cuatro sondas son defensivas que se pueden implementar:
 * sirven para comprobar qué contiene tu supuesto sandbox ANTES de dejar que un modelo escriba en él.
 *
 * Las tres primeras se contienen. La cuarta no. Y no es un fallo de Node:
 * `vm` nunca prometió lo contrario.
 */
export const SANDBOX_PROBES = [
  {
    label: 'Bucle infinito',
    code: 'while (true) {}',
    expectation: 'debe cortar por timeout',
  },
  {
    label: 'Acceso a require',
    code: 'return typeof require;',
    expectation: 'debe ser "undefined"',
  },
  {
    label: 'Acceso a process',
    code: 'return typeof process;',
    expectation: 'debe ser "undefined"',
  },
  {
    label: 'Salto de realm vía globalThis.constructor',
    code: "return typeof globalThis.constructor.constructor('return process')();",
    expectation: 'DEBERÍA ser "undefined"… compruébalo',
  },
];
