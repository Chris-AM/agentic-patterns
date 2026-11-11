import { test } from 'node:test';
import assert from 'node:assert/strict';

import { toolNamesOf, toolResultsOf } from './tool-results.js';

const steps = [
  { toolResults: [{ toolName: 'a', input: {}, output: 1 }] },
  { toolResults: [] },
  { toolResults: [{ toolName: 'b', input: {}, output: 2 }, { toolName: 'a', input: {}, output: 3 }] },
];

test('toolResultsOf filtra los resultados de una tool', () => {
  assert.deepEqual(toolResultsOf(steps, 'a').map((r) => r.output), [1, 3]);
});

test('toolNamesOf lista las tools ejecutadas, en orden', () => {
  assert.deepEqual(toolNamesOf(steps), ['a', 'b', 'a']);
});
