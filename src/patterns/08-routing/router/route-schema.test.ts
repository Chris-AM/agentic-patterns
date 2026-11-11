import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildRouteSchema, routerInstructions } from './route-schema.js';

const categories = { ventas: 'Precios.', soporte: 'Accesos.' };
const fallback = { route: 'humano', description: 'Ambiguas o fuera de dominio.' } as const;

test('el schema acepta las categorías y la ruta de fallback', () => {
  const schema = buildRouteSchema(categories, fallback);
  assert.equal(schema.safeParse({ department: 'ventas', reason: 'x' }).success, true);
  assert.equal(schema.safeParse({ department: 'humano', reason: 'x' }).success, true);
});

test('el schema rechaza rutas inexistentes', () => {
  const schema = buildRouteSchema(categories, fallback);
  assert.equal(schema.safeParse({ department: 'pizzas', reason: 'x' }).success, false);
});

test('el fallback no puede llamarse igual que una categoría', () => {
  assert.throws(
    () => buildRouteSchema(categories, { route: 'ventas', description: 'x' }),
    /fallback/
  );
});

test('las instrucciones listan el fallback y cuándo usarlo', () => {
  const text = routerInstructions(categories, fallback);
  assert.match(text, / - ventas: Precios\./);
  assert.match(text, / - humano: Ambiguas o fuera de dominio\./);
  assert.match(text, /no encaja con claridad.*"humano"/);
});
