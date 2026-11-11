import { test } from 'node:test';
import assert from 'node:assert/strict';

import { describeDb, runCodeAction } from './run-code-tool.js';

const options = {
  db: { items: [{ name: 'a', size: 1 }], unit: 2 },
  timeoutMs: 200,
  validate: (value: unknown) => (value === 42 ? [] : ['Debe ser 42']),
  failureHint: 'Revisa db.items.',
};

test('describeDb deriva la forma de db desde los datos', () => {
  assert.equal(
    describeDb(options.db),
    '  db.items → [{ name, size }]\n  db.unit → number'
  );
});

test('una excepción vuelve como observación con su error', () => {
  const output = runCodeAction('throw new Error("boom");', options);
  assert.equal(output.ok, false);
  assert.equal(output.error, 'boom');
  assert.match(output.hint, /excepción/);
});

test('un valor inválido devuelve los checks fallidos y la pista del caso', () => {
  const output = runCodeAction('return 1;', options);
  assert.equal(output.ok, false);
  assert.deepEqual(output.failedChecks, ['Debe ser 42']);
  assert.match(output.hint, /Debe ser 42/);
  assert.match(output.hint, /Revisa db\.items\./);
});

test('un valor válido vuelve con ok y el valor', () => {
  const output = runCodeAction('```js\nreturn 40 + db.unit;\n```', options);
  assert.equal(output.ok, true);
  assert.equal(output.value, 42);
  assert.deepEqual(output.failedChecks, []);
});
