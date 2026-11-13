import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { CatalogEntry } from './game-catalog.js';
import { auditReport } from './report-checks.js';

const catalog: CatalogEntry[] = [
  { title: 'Prince of Persia Remake', released: '2026-12-31', hype: 1045, platforms: ['pc', 'playstation', 'xbox'] },
  { title: 'Path of Exile 2', released: '2026-12-11', hype: 300, platforms: ['pc'] },
  { title: 'Metroid Ravenous', released: '2027-01-28', hype: 9, platforms: ['nintendo'] },
];

const failed = (report: string, missing: string[] = []) =>
  auditReport(report, catalog, missing)
    .filter((check) => !check.passed)
    .map((check) => check.label);

const GOOD =
  '**Prince of Persia Remake** (PC, PlayStation, Xbox) el 31 de diciembre, ' +
  '**Path of Exile 2** en PC y **Metroid Ravenous** en Nintendo.';

test('un informe correcto pasa todos los checks', () => {
  assert.deepEqual(failed(GOOD), []);
});

test('detecta una plataforma con juegos que quedó sin títulos (el caso de tu corrida)', () => {
  const report = '**Path of Exile 2** en PC y **Metroid Ravenous** en Nintendo. PlayStation y Xbox no tienen estrenos.';
  const labels = failed(report);
  assert.ok(labels.some((l) => l.includes('playstation')), labels.join(' | '));
  assert.ok(labels.some((l) => l.includes('xbox')), labels.join(' | '));
});

test('detecta que falta el más esperado de una plataforma', () => {
  const report = '**Path of Exile 2** en PC, **Prince of Persia Remake** en consolas y **Metroid Ravenous**.';
  assert.deepEqual(failed(report.replace('**Prince of Persia Remake** en consolas y ', '')).some((l) => l.includes('más esperado')), true);
});

test('detecta títulos en negrita que no están en el catálogo (inventados)', () => {
  assert.ok(failed(GOOD + ' Y **Half-Life 3** en PC.').some((l) => l.includes('inventados')));
});

test('detecta un título mencionado más de una vez', () => {
  assert.ok(failed(GOOD + ' Repito: **Path of Exile 2**.').some((l) => l.includes('duplicados')));
});

test('si faltaron temas, el informe debe declararlos', () => {
  // Informe que no menciona el tema faltante en ninguna parte.
  const base = '**Metroid Ravenous** en Nintendo.';
  assert.ok(failed(base, ['xbox']).some((l) => l.includes('faltantes')));
  assert.equal(failed(base + ' No pudimos consultar xbox.', ['xbox']).some((l) => l.includes('faltantes')), false);
});
