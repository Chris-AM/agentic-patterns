import { test } from 'node:test';
import assert from 'node:assert/strict';

import { composeInstructions } from './context.js';

test('composeInstructions agrega los hechos fijos calculados por el sistema', () => {
  const text = composeInstructions('Rol.', 'Regla.', { hoy: '2026-11-13', ventana: '2026-11-13 → 2027-02-11' });
  assert.match(text, /^Rol\.\nRegla\./);
  assert.match(text, /- hoy: 2026-11-13/);
  assert.match(text, /- ventana: 2026-11-13 → 2027-02-11/);
});

test('sin hechos, no agrega el bloque', () => {
  assert.equal(composeInstructions('Rol.', 'Regla.', {}), 'Rol.\nRegla.');
});
