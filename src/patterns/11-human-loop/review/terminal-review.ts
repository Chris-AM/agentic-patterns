import { createInterface } from 'node:readline/promises';

import { PURCHASES, REFUND_WINDOW_DAYS } from '../data/purchases.js';
import { TICKETS } from '../data/tickets.js';
import type { DecisionCategory } from '../ledger/ledger.js';
import type { Reviewer, ReviewRequest, Verdict } from './reviewer.js';

// ---------------------------------------------------------------------------
// EL REVISOR — la persona frente a la terminal
// En la vida real podría ser guardado en una base de datos o en un sistema de gestión de aprobaciones
// y el AI únicamente delegarlo para intervención humana por ese lado.
// ---------------------------------------------------------------------------

let terminal: ReturnType<typeof createInterface> | null = null;

export function openTerminal() {
  // Sin TTY readline resuelve al instante y el gate sería decorativo.
  if (!process.stdin.isTTY) {
    throw new Error('Este laboratorio necesita una terminal interactiva. ');
  }

  terminal ??= createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return terminal;
}

/** Todo lo que necesitas ver antes de decidir. */
export function renderApprovalPanel(input: ReviewRequest) {
  const line = '─'.repeat(64);
  const purchase = PURCHASES.find((item) => item.id === input.purchaseId);
  const ticket = TICKETS.find((item) => item.email === purchase?.email);

  console.log(`\n  ┌${line}`.yellow);
  console.log(`  │ ${'⏸  APROBACIÓN REQUERIDA'.yellow}`);
  console.log(`  │ El agente quiere ejecutar: ${'issueRefund'.red}`);
  console.log(`  │ Motivo del agente: ${input.reason}`);
  console.log(`  ├${line}`.yellow);

  if (!purchase) {
    console.log(`  │ ⚠️  La compra ${input.purchaseId} NO EXISTE`.red);
  } else {
    console.log(`  │ Ticket:     ${ticket?.id ?? '?'} · ${purchase.email}`);
    console.log(`  │ Pidió:      "${ticket?.text ?? '—'}"`);
    console.log(`  │ Compra:     ${purchase.id} · ${purchase.course}`);
    console.log(`  │ Monto:      ${String(purchase.amountUSD).red} USD`);
    console.log(
      `  │ Antigüedad: ${String(purchase.daysSincePurchase).red} días ` +
        `(plazo: ${REFUND_WINDOW_DAYS} días)`
    );
    console.log(`  │ Reversible: ${'NO'.red}`);
  }

  console.log(`  ├${line}`.yellow);
  console.log(`  │ ${'[1]'.green} Aprobar y ejecutar`);
  console.log(`  │ ${'[2]'.red} Rechazar (el agente informará al cliente)`);
  console.log(`  └${line}`.yellow);
}

/** El proceso se detiene aquí hasta que escribas en el teclado. */
const REJECTION_CATEGORIES: DecisionCategory[] = [
  'fuera-de-politica',
  'datos-incorrectos',
  'falta-informacion',
  'otro',
];

export async function review(input: ReviewRequest): Promise<Verdict> {
  renderApprovalPanel(input);

  const io = openTerminal();

  let choice = '';

  while (choice !== '1' && choice !== '2') {
    choice = await io.question('\n Tu decisión [1/2]: ');
    choice = choice.trim();

    if (choice !== '1' && choice !== '2') {
      console.log('    Escribe 1 para aprobar o 2 para rechazar'.yellow);
    }
  }

  const approved = choice === '1';

  if (approved) {
    const note = await io.question('   Nota interna para el registro (opcional): ');
    return {
      approved,
      by: 'humano:consola',
      category: 'aprobado',
      internalNote: note.trim(),
      customerMessage: '',
    };
  }

  // Categoría estructurada: lo que se puede medir (mejora 3).
  let index = -1;
  while (!(index >= 0 && index < REJECTION_CATEGORIES.length)) {
    const answer = await io.question(
      `   Categoría [${REJECTION_CATEGORIES.map((c, i) => `${i + 1}=${c}`).join(', ')}]: `
    );
    index = Number(answer.trim()) - 1;
  }

  // Nota interna y mensaje al cliente van separados: la nota nunca sale.
  const internalNote = await io.question('   Nota interna (solo registro, no llega al cliente): ');
  const customerMessage = await io.question('   Mensaje para el cliente (el agente lo usará): ');

  return {
    approved,
    by: 'humano:consola',
    category: REJECTION_CATEGORIES[index]!,
    internalNote: internalNote.trim(),
    customerMessage: customerMessage.trim() || 'La solicitud no fue aprobada.',
  };
}

/**
 * Cierra la terminal. Única pieza nueva de la segregación: `terminal` es un
 * `let` de este módulo y una importación no se puede reasignar desde fuera.
 */
export function closeTerminal() {
  terminal?.close();
  terminal = null;
}

/** La implementación de terminal del contrato `Reviewer`. */
export const terminalReviewer: Reviewer = { review, close: closeTerminal };
