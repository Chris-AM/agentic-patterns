import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildRouteSchema, routerInstructions } from './route-schema.js';

const router = {
  role: 'Eres la recepción de un restaurante.',
  categories: { ventas: 'Precios.', soporte: 'Accesos.' },
  fallback: { route: 'humano', description: 'Ambiguas o fuera de dominio.' },
} as const;

test('el schema acepta las categorías y la ruta de fallback en `route`', () => {
  const schema = buildRouteSchema(router);
  assert.equal(schema.safeParse({ route: 'ventas', reason: 'x' }).success, true);
  assert.equal(schema.safeParse({ route: 'humano', reason: 'x' }).success, true);
});

test('el schema rechaza rutas inexistentes', () => {
  const schema = buildRouteSchema(router);
  assert.equal(schema.safeParse({ route: 'pizzas', reason: 'x' }).success, false);
});

test('el fallback no puede llamarse igual que una categoría', () => {
  assert.throws(
    () => buildRouteSchema({ ...router, fallback: { route: 'ventas', description: 'x' } }),
    /fallback/
  );
});

test('las instrucciones usan el rol de la instancia y listan el fallback', () => {
  const text = routerInstructions(router);
  assert.match(text, /^Eres la recepción de un restaurante\./);
  assert.doesNotMatch(text, /centralista/);
  assert.match(text, / - ventas: Precios\./);
  assert.match(text, / - humano: Ambiguas o fuera de dominio\./);
  assert.match(text, /no encaja con claridad.*"humano"/);
});
