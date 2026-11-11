import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mergeTools } from '../router/specialists.js';
import { DEPARTMENTS, expectedToolOf, type Department } from './departments.js';

test('cada departamento tiene exactamente una tool', () => {
  for (const [name, department] of Object.entries(DEPARTMENTS)) {
    assert.equal(Object.keys(department.tools).length, 1, name);
  }
});

test('las tools de los departamentos son disjuntas', () => {
  assert.doesNotThrow(() => mergeTools(DEPARTMENTS));
});

test('expectedToolOf se deriva de la llave de la tool', () => {
  const expected: Record<Department, string> = {
    ventas: 'sendCatalog',
    soporte: 'openTicket',
    facturacion: 'resendInvoice',
  };
  for (const name of Object.keys(DEPARTMENTS) as Department[]) {
    assert.equal(expectedToolOf(name), expected[name]);
  }
});
