import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isResolved } from './call-checks.js';
import { CALLS } from './calls.js';
import { FALLBACK } from './departments.js';

const check = (expected: string, routedTo: string, toolsUsed: string[] = []) =>
  ({ callId: 1, expected, routedTo, toolsUsed }) as Parameters<typeof isResolved>[0];

test('un departamento se resuelve solo con su tool esperada', () => {
  assert.equal(isResolved(check('ventas', 'ventas', ['sendCatalog'])), true);
  assert.equal(isResolved(check('ventas', 'soporte', ['openTicket'])), false);
});

test('el fallback se resuelve si fue a la ruta humana sin ejecutar tools', () => {
  assert.equal(isResolved(check(FALLBACK.route, FALLBACK.route)), true);
  assert.equal(isResolved(check(FALLBACK.route, 'ventas', ['sendCatalog'])), false);
  assert.equal(isResolved(check(FALLBACK.route, 'Operador único')), false);
});

test('mandar al fallback una llamada clara no la resuelve', () => {
  assert.equal(isResolved(check('soporte', FALLBACK.route)), false);
});

test('el ground truth incluye llamadas que esperan el fallback', () => {
  assert.ok(CALLS.some((call) => call.expected === FALLBACK.route));
});
