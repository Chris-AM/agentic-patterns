import { test } from 'node:test';
import assert from 'node:assert/strict';

import { assertStepBudget, categoriesOf, mergeTools } from './specialists.js';

const fakeTool = {} as never;
const specialists = {
  ventas: { description: 'Precios.', instructions: 'i', tools: { sendCatalog: fakeTool } },
  soporte: { description: 'Accesos.', instructions: 'i', tools: { openTicket: fakeTool } },
};

test('categoriesOf deriva las rutas desde las descripciones', () => {
  assert.deepEqual(categoriesOf(specialists), { ventas: 'Precios.', soporte: 'Accesos.' });
});

test('mergeTools une las tools de todos los especialistas', () => {
  assert.deepEqual(Object.keys(mergeTools(specialists)), ['sendCatalog', 'openTicket']);
});

test('mergeTools rechaza tools compartidas: deben ser disjuntas', () => {
  assert.throws(
    () =>
      mergeTools({
        ...specialists,
        facturacion: { description: 'd', instructions: 'i', tools: { openTicket: fakeTool } },
      }),
    /openTicket/
  );
});

test('el presupuesto de pasos es obligatorio y entero positivo', () => {
  for (const invalid of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => assertStepBudget(invalid), RangeError, String(invalid));
  }
  assert.doesNotThrow(() => assertStepBudget(3));
});
