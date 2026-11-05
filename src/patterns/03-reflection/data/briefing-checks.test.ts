import { test } from 'node:test';
import assert from 'node:assert/strict';

import { auditBriefing } from './briefing-checks.js';

function rewardPassed(text: string) {
  return auditBriefing(text).find((check) => check.label === 'Recompensa')!
    .passed;
}

test('Recompensa: acepta los separadores de miles válidos', () => {
  for (const amount of [
    '250.000', // punto
    '250,000', // coma
    '250000', // sin separador
    '250 000', // espacio (caso real, ronda C 5-nov-2026)
    '250 000', // espacio duro
    '250 000', // espacio fino
  ]) {
    assert.equal(rewardPassed(`Recompensa: ${amount} USD`), true, amount);
  }
});

test('Recompensa: rechaza un monto distinto', () => {
  assert.equal(rewardPassed('Recompensa: 25.000 USD'), false);
  assert.equal(rewardPassed('Sin recompensa indicada'), false);
});
