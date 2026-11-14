import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createLedger } from './ledger.js';

test('cada corrida tiene su propio libro mayor (no se arrastra estado)', () => {
  const first = createLedger();
  first.recordEffect({ purchaseId: 'P-1', detail: 'd', amountUSD: 10, approvedBy: 'x' });
  assert.equal(createLedger().effects().length, 0);
});

test('totals suma cantidad y monto de los efectos', () => {
  const ledger = createLedger();
  ledger.recordEffect({ purchaseId: 'P-1', detail: 'd', amountUSD: 10, approvedBy: 'x' });
  ledger.recordEffect({ purchaseId: 'P-2', detail: 'd', amountUSD: 5.5, approvedBy: 'x' });
  assert.deepEqual(ledger.totals(), { count: 2, usd: 15.5 });
});

test('las lecturas devuelven copias: no se puede mutar el registro desde fuera', () => {
  const ledger = createLedger();
  ledger.effects().push({ purchaseId: 'P-1', detail: 'd', amountUSD: 1, approvedBy: 'x' });
  assert.equal(ledger.effects().length, 0);
});
