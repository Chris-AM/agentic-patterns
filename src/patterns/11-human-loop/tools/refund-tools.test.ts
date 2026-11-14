import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PURCHASES } from '../data/purchases.js';
import { createLedger } from '../ledger/ledger.js';
import { buildRefundTools } from './refund-tools.js';

const run = (tools: ReturnType<typeof buildRefundTools>, purchaseId: string, toolCallId = 'call-1') =>
  tools.issueRefund.execute!({ purchaseId, reason: 'x' }, { toolCallId, messages: [] } as never);

test('el reembolso es idempotente: la misma compra no se devuelve dos veces', async () => {
  const ledger = createLedger();
  const tools = buildRefundTools({ purchases: PURCHASES, ledger });

  await run(tools, 'P-1001', 'call-1');
  const second = await run(tools, 'P-1001', 'call-2');

  assert.equal(ledger.effects().length, 1);
  assert.match(JSON.stringify(second), /already-refunded/);
});

test('sin aprobación humana, el efecto y la decisión quedan firmados como automáticos', async () => {
  const ledger = createLedger();
  await run(buildRefundTools({ purchases: PURCHASES, ledger }), 'P-1001');

  assert.match(ledger.effects()[0]!.approvedBy, /automático/);
  assert.equal(ledger.decisions()[0]!.approved, true);
  assert.match(ledger.decisions()[0]!.by, /automático/);
});

test('con aprobación humana registrada, el efecto queda firmado por quien aprobó', async () => {
  const ledger = createLedger();
  ledger.approve('call-9', 'humano:test');
  await run(buildRefundTools({ purchases: PURCHASES, ledger }), 'P-2044', 'call-9');
  assert.equal(ledger.effects()[0]!.approvedBy, 'humano:test');
});

test('una compra inexistente no produce efectos', async () => {
  const ledger = createLedger();
  await run(buildRefundTools({ purchases: PURCHASES, ledger }), 'P-9999');
  assert.equal(ledger.effects().length, 0);
});
