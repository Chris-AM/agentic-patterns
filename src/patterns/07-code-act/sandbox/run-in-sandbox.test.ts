import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SANDBOX_PROBES } from './probes.js';
import { runInSandbox } from './run-in-sandbox.js';

const TIMEOUT_MS = 200;

function probe(label: string) {
  const found = SANDBOX_PROBES.find((p) => p.label === label);
  assert.ok(found, `no existe la sonda "${label}"`);
  return runInSandbox(found.code, {}, TIMEOUT_MS);
}

test('expone en `db` los datos que recibe por parámetro', () => {
  const result = runInSandbox('return db.items.length;', { items: [1, 2, 3] }, TIMEOUT_MS);
  assert.deepEqual(result, { ok: true, value: 3, logs: [] });
});

test('el código no puede mutar `db` ni los datos originales', () => {
  const original = { items: [1] };
  const result = runInSandbox('db.items.push(2); return 1;', original, TIMEOUT_MS);

  assert.equal(result.ok, false);
  assert.deepEqual(original.items, [1]);
  assert.equal(Object.isFrozen(original), false, 'el original no debe quedar congelado');
});

test('modo estricto: escribir sobre datos congelados lanza error visible', () => {
  const result = runInSandbox('db.items[0] = 99; return db.items[0];', { items: [1] }, TIMEOUT_MS);
  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /read only/);
});

test('el timeout es obligatorio: rechaza valores que desactivan el techo', () => {
  for (const invalid of [0, -1, Number.POSITIVE_INFINITY, Number.NaN]) {
    assert.throws(() => runInSandbox('return 1;', {}, invalid), RangeError, String(invalid));
  }
});

test('sonda: un bucle infinito se corta por timeout', () => {
  const result = probe('Bucle infinito');
  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /timed out/i);
});

test('sonda: require y process no existen en el ámbito', () => {
  assert.equal(probe('Acceso a require').value, 'undefined');
  assert.equal(probe('Acceso a process').value, 'undefined');
});

test('sonda: el salto de realm SÍ llega a process (límite conocido de node:vm)', () => {
  // Documenta la fuga: si algún día esto pasa a "undefined", el aislamiento cambió.
  assert.equal(probe('Salto de realm vía globalThis.constructor').value, 'object');
});
