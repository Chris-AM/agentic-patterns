import { test } from 'node:test';
import assert from 'node:assert/strict';

import { tool } from 'ai';
import { z } from 'zod';

import { createPhases, type PhasesConfig } from './create-phases.js';
import { mockModel, sentTo } from './test-model.js';

const fakeTool = tool({
  description: 'Busca algo.',
  inputSchema: z.object({ q: z.string() }),
  execute: async ({ q }) => ({ found: [`resultado de ${q}`] }),
});

const FACTS = { hoy: '2026-11-13', ventana: '2026-11-13 → 2027-02-11' };

function config(overrides: Partial<PhasesConfig> = {}): PhasesConfig {
  return {
    tracer: { onStepFinish: () => {} },
    limits: { maxTasks: 4, workerSteps: 2, workerTimeoutMs: 1000 },
    prompts: {
      planner: 'Eres el planificador de una newsletter de videojuegos.',
      worker: 'Eres un investigador de videojuegos.',
      integrator: 'Eres editor de una newsletter de videojuegos.',
    },
    tools: { fakeTool },
    subjects: ['pc', 'xbox'],
    facts: FACTS,
    ...overrides,
  };
}

test('la fábrica rechaza límites inválidos al crearse', () => {
  for (const limits of [
    { maxTasks: 0, workerSteps: 2, workerTimeoutMs: 1000 },
    { maxTasks: 4, workerSteps: 1.5, workerTimeoutMs: 1000 },
    { maxTasks: -1, workerSteps: 2, workerTimeoutMs: 1000 },
    { maxTasks: 4, workerSteps: 2, workerTimeoutMs: 0 },
  ]) {
    assert.throws(() => createPhases(config({ limits })), RangeError, JSON.stringify(limits));
  }
});

test('la fábrica exige al menos un subject', () => {
  assert.throws(() => createPhases(config({ subjects: [] })), RangeError);
});

test('plan: devuelve tareas con subject estructurado y recibe los hechos fijos', async () => {
  const model = mockModel(
    JSON.stringify({ tasks: [{ topic: 'PC', subject: 'pc', assignment: 'Busca PC' }] })
  );
  const tasks = await createPhases(config({ model })).plan('¿Qué sale para PC?');

  assert.deepEqual(tasks, [{ topic: 'PC', subject: 'pc', assignment: 'Busca PC' }]);
  const sent = sentTo(model);
  assert.match(sent, /planificador de una newsletter de videojuegos/);
  assert.match(sent, /investigaciones independientes/);
  assert.match(sent, /hoy: 2026-11-13/);
});

test('runWorker: recibe subject + hechos, y devuelve los datos de sus tools leídos de la traza', async () => {
  const model = mockModel({ toolCall: { toolName: 'fakeTool', input: { q: 'pc' } } }, 'Notas del worker.');
  const result = await createPhases(config({ model })).runWorker({
    subject: 'pc',
    assignment: 'Busca PC',
  });

  assert.equal(result.notes, 'Notas del worker.');
  assert.deepEqual(result.data, [{ toolName: 'fakeTool', output: { found: ['resultado de pc'] } }]);
  const sent = sentTo(model);
  assert.match(sent, /pc/);
  assert.match(sent, /Busca PC/);
  assert.match(sent, /ventana: 2026-11-13 → 2027-02-11/);
});

test('integrate: recibe los datos como fuente de verdad, además de las notas y los hechos', async () => {
  const model = mockModel('Informe.');
  const report = await createPhases(config({ model })).integrate('¿Qué sale?', [
    { topic: 'PC', subject: 'pc', notes: 'Nota', data: [{ toolName: 'fakeTool', output: { found: ['Juego X'] } }] },
  ]);

  assert.equal(report, 'Informe.');
  const sent = sentTo(model);
  assert.match(sent, /Juego X/);
  assert.match(sent, /fuente de verdad/);
  assert.match(sent, /hoy: 2026-11-13/);
});

test('integrate: recibe el consolidado del sistema y debe declarar los temas faltantes', async () => {
  const model = mockModel('Informe.');
  await createPhases(config({ model })).integrate('¿Qué sale?', [], {
    consolidated: [{ title: 'Juego Consolidado', platforms: ['pc', 'xbox'] }],
    missing: ['xbox'],
  });

  const sent = sentTo(model);
  assert.match(sent, /Juego Consolidado/);
  assert.match(sent, /consolidad/i);
  assert.match(sent, /xbox/);
  assert.match(sent, /decl[aá]ra/i);
});

test('portabilidad: otra instancia no arrastra nada del caso de videojuegos', async () => {
  const model = mockModel(
    JSON.stringify({ tasks: [{ topic: 'C1', subject: 'C1', assignment: 'Revisa C1' }] })
  );
  await createPhases(
    config({
      model,
      subjects: ['C1', 'C2'],
      facts: { 'fecha de corte': '2026-12-31' },
      prompts: {
        planner: 'Eres el planificador de una revisión legal de contratos.',
        worker: 'Eres un abogado revisor.',
        integrator: 'Eres el redactor del informe legal.',
      },
    })
  ).plan('Revisa los contratos C1 y C2');

  const sent = sentTo(model);
  assert.doesNotMatch(sent, /videojuego/i);
  assert.match(sent, /contratos/);
  assert.match(sent, /investigaciones independientes/);
});
