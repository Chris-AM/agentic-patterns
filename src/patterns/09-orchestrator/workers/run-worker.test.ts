import { test } from 'node:test';
import assert from 'node:assert/strict';

import { assertStepBudget } from './run-worker.js';

test('el techo del worker es obligatorio y entero positivo', () => {
  for (const invalid of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => assertStepBudget(invalid), RangeError, String(invalid));
  }
  assert.doesNotThrow(() => assertStepBudget(3));
});
