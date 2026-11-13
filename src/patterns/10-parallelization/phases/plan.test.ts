import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildPlanSchema } from './plan.js';

const task = { topic: 't', subject: 'pc', assignment: 'a' };
const subjects = ['pc', 'xbox'];

test('buildPlanSchema respeta el máximo de tareas de la instancia', () => {
  const schema = buildPlanSchema(3, subjects);
  assert.equal(schema.safeParse({ tasks: [task, task, task] }).success, true);
  assert.equal(schema.safeParse({ tasks: [task, task, task, task] }).success, false);
});

test('un plan vacío nunca es válido (piso del núcleo)', () => {
  assert.equal(buildPlanSchema(3, subjects).safeParse({ tasks: [] }).success, false);
});

test('el subject de cada tarea debe estar entre los que declara la instancia', () => {
  const schema = buildPlanSchema(3, subjects);
  assert.equal(schema.safeParse({ tasks: [{ ...task, subject: 'sega' }] }).success, false);
});
