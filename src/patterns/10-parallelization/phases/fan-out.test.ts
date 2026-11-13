import { test } from 'node:test';
import assert from 'node:assert/strict';

import { fanOut } from './fan-out.js';

test('devuelve un resultado por item, en orden', async () => {
  const results = await fanOut([1, 2, 3], async (n) => n * 10, { timeoutMs: 200 });
  assert.deepEqual(results.map((r) => (r.ok ? r.value : null)), [10, 20, 30]);
});

test('un fallo no tumba a los demás: errores parciales', async () => {
  const results = await fanOut(
    ['a', 'b'],
    async (item) => {
      if (item === 'b') throw new Error('RAWG caído');
      return item.toUpperCase();
    },
    { timeoutMs: 200 }
  );
  assert.deepEqual(results[0], { item: 'a', ok: true, value: 'A' });
  assert.equal(results[1]!.ok, false);
  assert.match(results[1]!.ok ? '' : results[1]!.error, /RAWG caído/);
});

test('un worker lento se corta por timeout y se le avisa con la señal', async () => {
  let aborted = false;
  const startedAt = Date.now();
  const [result] = await fanOut(
    ['lento'],
    (_item, signal) =>
      new Promise<string>(() => {
        signal.addEventListener('abort', () => (aborted = true));
      }),
    { timeoutMs: 50 }
  );

  assert.equal(result!.ok, false);
  assert.match(result!.ok ? '' : result!.error, /timeout/i);
  assert.equal(aborted, true);
  assert.ok(Date.now() - startedAt < 500);
});

test('el timeout es obligatorio y entero positivo', async () => {
  for (const timeoutMs of [0, -1, 1.5, Number.POSITIVE_INFINITY]) {
    await assert.rejects(fanOut([1], async (n) => n, { timeoutMs }), RangeError, String(timeoutMs));
  }
});
