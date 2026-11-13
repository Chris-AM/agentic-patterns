import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildPlanSchema } from './plan.js';

const task = { topic: 't', assignment: 'a' };

test('buildPlanSchema respeta el máximo de tareas de la instancia', () => {
  const schema = buildPlanSchema(3);
  assert.equal(schema.safeParse({ tasks: [task, task, task] }).success, true);
  assert.equal(schema.safeParse({ tasks: [task, task, task, task] }).success, false);
});

test('un plan vacío nunca es válido (piso del núcleo)', () => {
  assert.equal(buildPlanSchema(3).safeParse({ tasks: [] }).success, false);
});
