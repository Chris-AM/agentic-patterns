import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ID_PREFIX } from '../tools/department-tools.js';
import { auditAnswer, collectIds, inventedIds } from './answer-checks.js';
import { DEPARTMENTS } from './departments.js';

const workerSteps = [
  { toolResults: [{ toolName: 'sendCatalog', input: {}, output: { catalogId: 'CAT-1111', interest: 'Flutter' } }] },
];
const orchestratorSteps = [
  {
    toolResults: [
      { toolName: 'delegateToSoporte', input: {}, output: { department: 'soporte', result: '...', issuedIds: ['TK-2222'] } },
      { toolName: 'delegateToFacturacion', input: {}, output: { department: 'facturacion', result: '...', issuedIds: ['INV-3333'] } },
    ],
  },
];

test('cada tool de departamento tiene su prefijo de ID', () => {
  for (const department of Object.values(DEPARTMENTS)) {
    for (const toolName of Object.keys(department.tools)) {
      assert.ok(toolName in ID_PREFIX, toolName);
    }
  }
});

test('collectIds lee los IDs emitidos por los workers y por las delegaciones', () => {
  assert.deepEqual(collectIds(workerSteps), ['CAT-1111']);
  assert.deepEqual(collectIds(orchestratorSteps), ['TK-2222', 'INV-3333']);
});

test('una parte se resuelve solo con un ID que realmente se emitió', () => {
  const issued = ['CAT-1111', 'TK-2222', 'INV-3333'];
  const checks = auditAnswer('Factura INV-3333, ticket TK-2222, catálogo CAT-1111.', issued);
  assert.deepEqual(checks.map((c) => c.passed), [true, true, true]);
});

test('un ID inventado con la forma correcta NO resuelve la parte', () => {
  const checks = auditAnswer('Su factura es INV-9999.', ['INV-3333']);
  const facturacion = checks.find((c) => c.label.startsWith('facturacion'))!;
  assert.equal(facturacion.passed, false);
});

test('inventedIds lista los IDs con forma válida que nadie emitió', () => {
  assert.deepEqual(inventedIds('INV-9999 y TK-2222', ['TK-2222']), ['INV-9999']);
});
