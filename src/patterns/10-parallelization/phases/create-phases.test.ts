import { test } from 'node:test';
import assert from 'node:assert/strict';

import { tool } from 'ai';
import { z } from 'zod';

import { createPhases, type PhasesConfig } from './create-phases.js';
import { mockModel, sentTo } from './test-model.js';

const fakeTool = tool({
  description: 'Busca algo.',
  inputSchema: z.object({ q: z.string() }),
  execute: async () => ({ ok: true }),
});

function config(overrides: Partial<PhasesConfig> = {}): PhasesConfig {
  let steps = 0;
  return {
    tracer: { onStepFinish: () => void steps++ },
    limits: { maxTasks: 4, workerSteps: 2 },
    prompts: {
      planner: 'Eres el planificador de una newsletter de videojuegos.',
      worker: 'Eres un investigador de videojuegos.',
      integrator: 'Eres editor de una newsletter de videojuegos.',
    },
    tools: { fakeTool },
    ...overrides,
  };
}

test('la fábrica rechaza límites inválidos al crearse', () => {
  for (const limits of [
    { maxTasks: 0, workerSteps: 2 },
    { maxTasks: 4, workerSteps: 1.5 },
    { maxTasks: -1, workerSteps: 2 },
  ]) {
    assert.throws(() => createPhases(config({ limits })), RangeError, JSON.stringify(limits));
  }
});

test('plan: compone rol del caso + regla del mecanismo y devuelve las tareas', async () => {
  const model = mockModel(JSON.stringify({ tasks: [{ topic: 'PC', assignment: 'Busca PC' }] }));
  const tasks = await createPhases(config({ model })).plan('¿Qué sale para PC?');

  assert.deepEqual(tasks, [{ topic: 'PC', assignment: 'Busca PC' }]);
  const sent = sentTo(model);
  assert.match(sent, /planificador de una newsletter de videojuegos/);
  assert.match(sent, /investigaciones independientes/);
  assert.match(sent, /¿Qué sale para PC\?/);
});

test('runWorker: usa las tools inyectadas y el rol del caso', async () => {
  const model = mockModel('Hallazgo.');
  const text = await createPhases(config({ model })).runWorker('Busca PC');

  assert.equal(text, 'Hallazgo.');
  const sent = sentTo(model);
  assert.match(sent, /fakeTool/);
  assert.match(sent, /investigador de videojuegos/);
  assert.match(sent, /Busca PC/);
});

test('integrate: recibe la petición y los hallazgos, y avisa al tracer', async () => {
  const model = mockModel('Informe.');
  let observed = 0;
  const phases = createPhases(config({ model, tracer: { onStepFinish: () => void observed++ } }));

  const report = await phases.integrate('¿Qué sale?', [{ topic: 'PC', findings: 'Juego X' }]);

  assert.equal(report, 'Informe.');
  assert.match(sentTo(model), /¿Qué sale\?/);
  assert.match(sentTo(model), /Juego X/);
  assert.equal(observed, 1);
});

test('portabilidad: otra instancia no arrastra nada del caso de videojuegos', async () => {
  const model = mockModel(JSON.stringify({ tasks: [{ topic: 'C1', assignment: 'Revisa C1' }] }));
  const contracts = config({
    model,
    prompts: {
      planner: 'Eres el planificador de una revisión legal de contratos.',
      worker: 'Eres un abogado revisor.',
      integrator: 'Eres el redactor del informe legal.',
    },
  });

  await createPhases(contracts).plan('Revisa los contratos C1 y C2');

  const sent = sentTo(model);
  assert.doesNotMatch(sent, /videojuego/i);
  assert.match(sent, /contratos/);
  assert.match(sent, /investigaciones independientes/);
});
