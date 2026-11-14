import { test } from 'node:test';
import assert from 'node:assert/strict';

import { mockModel, sentTo } from '../../../helpers/test-model.js';
import { buildToolApproval } from '../approval/tool-approval.js';
import { PURCHASES } from '../data/purchases.js';
import { createLedger } from '../ledger/ledger.js';
import type { Reviewer, Verdict } from '../review/reviewer.js';
import { buildRefundTools } from '../tools/refund-tools.js';
import { runHitl } from './run-hitl.js';

const POLICY = { refundWindowDays: 30, maxRefundsPerRun: 5, maxRefundUSDPerRun: 1000 };
const refundCall = { toolCall: { toolName: 'issueRefund', input: { purchaseId: 'P-2044', reason: 'Lo pidió' } } };

const fakeReviewer = (verdict: Verdict): Reviewer & { seen: number } => {
  const reviewer = {
    seen: 0,
    review: async () => {
      reviewer.seen++;
      return verdict;
    },
  };
  return reviewer;
};

function setup(model: ReturnType<typeof mockModel>, reviewer: Reviewer, maxRounds = 4) {
  const ledger = createLedger();
  const run = () =>
    runHitl({
      model,
      tools: buildRefundTools({ purchases: PURCHASES, ledger }),
      toolApproval: buildToolApproval({ purchases: PURCHASES, ledger, policy: POLICY }),
      instructions: 'Eres soporte.',
      inbox: 'Ticket de luis: reembolso de P-2044',
      reviewer,
      ledger,
      limits: { maxRounds, stepsPerRound: 4 },
      tracer: { onStepFinish: () => {} },
    });
  return { ledger, run };
}

test('aprobado: el reembolso se ejecuta firmado por el revisor y la decisión queda registrada', async () => {
  const reviewer = fakeReviewer({
    approved: true, by: 'humano:test', category: 'aprobado', internalNote: '', customerMessage: '',
  });
  const { ledger, run } = setup(mockModel(refundCall, 'Reembolso hecho.'), reviewer);

  const result = await run();

  assert.equal(reviewer.seen, 1);
  assert.equal(result.gates, 1);
  assert.equal(ledger.effects()[0]!.approvedBy, 'humano:test');
  assert.equal(ledger.decisions()[0]!.by, 'humano:test');
});

test('rechazado: sin efecto; el modelo recibe el mensaje al cliente, NUNCA la nota interna', async () => {
  const model = mockModel(refundCall, 'Lo siento, no procede.');
  const reviewer = fakeReviewer({
    approved: false,
    by: 'humano:test',
    category: 'fuera-de-politica',
    internalNote: 'posible abuso de reembolsos',
    customerMessage: 'La compra superó el plazo de 30 días.',
  });
  const { ledger, run } = setup(model, reviewer);

  await run();

  assert.equal(ledger.effects().length, 0);
  assert.deepEqual(
    { approved: ledger.decisions()[0]!.approved, category: ledger.decisions()[0]!.category },
    { approved: false, category: 'fuera-de-politica' }
  );
  assert.match(ledger.decisions()[0]!.internalNote, /abuso/);
  const second = sentTo(model, 1);
  assert.match(second, /superó el plazo/);
  assert.doesNotMatch(second, /abuso/);
});

test('el techo de rondas corta y lo hace visible', async () => {
  const reviewer = fakeReviewer({
    approved: false, by: 'humano:test', category: 'otro', internalNote: '', customerMessage: 'No.',
  });
  const { run } = setup(mockModel(refundCall, refundCall, refundCall, refundCall), reviewer, 2);

  const result = await run();
  assert.equal(result.hitRoundLimit, true);
  assert.equal(reviewer.seen, 2);
});

test('los límites del bucle son obligatorios y enteros positivos', async () => {
  const { run } = setup(mockModel('ok'), fakeReviewer({
    approved: true, by: 'x', category: 'aprobado', internalNote: '', customerMessage: '',
  }), 0);
  await assert.rejects(run(), RangeError);
});
