import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PURCHASES } from '../data/purchases.js';
import { createLedger } from '../ledger/ledger.js';
import { buildToolApproval } from './tool-approval.js';

const POLICY = { refundWindowDays: 30, maxRefundsPerRun: 2, maxRefundUSDPerRun: 100 };
const gate = (policy = POLICY, ledger = createLedger()) =>
  buildToolApproval({ purchases: PURCHASES, ledger, policy }).issueRefund;

test('dentro de plazo y de techos: se ejecuta sin preguntar', async () => {
  assert.equal(await gate()({ purchaseId: 'P-1001' }), undefined);
});

test('fuera de plazo: pausa para aprobación humana', async () => {
  assert.equal(await gate()({ purchaseId: 'P-2044' }), 'user-approval');
});

test('compra inexistente: fail closed (pregunta)', async () => {
  assert.equal(await gate()({ purchaseId: 'P-9999' }), 'user-approval');
});

test('la política se inyecta: con otro plazo cambia la decisión', async () => {
  const wide = { ...POLICY, refundWindowDays: 365, maxRefundUSDPerRun: 1000 };
  assert.equal(await gate(wide)({ purchaseId: 'P-2044' }), undefined);
});

test('techo agregado: superar el monto acumulado de la corrida pausa', async () => {
  const ledger = createLedger();
  ledger.recordEffect({ purchaseId: 'P-X', detail: 'previo', amountUSD: 90, approvedBy: 'test' });
  assert.equal(await gate(POLICY, ledger)({ purchaseId: 'P-1001' }), 'user-approval');
});

test('techo agregado: superar la cantidad de reembolsos de la corrida pausa', async () => {
  const ledger = createLedger();
  for (const id of ['P-A', 'P-B']) {
    ledger.recordEffect({ purchaseId: id, detail: id, amountUSD: 1, approvedBy: 'test' });
  }
  assert.equal(await gate(POLICY, ledger)({ purchaseId: 'P-1001' }), 'user-approval');
});

test('la política debe tener valores positivos', () => {
  assert.throws(
    () => buildToolApproval({ purchases: PURCHASES, ledger: createLedger(), policy: { ...POLICY, maxRefundsPerRun: 0 } }),
    RangeError
  );
});
