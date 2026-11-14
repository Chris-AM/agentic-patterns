/**
 * PATRÓN: Human-in-the-Loop - HITL
 * --------------------------------
 * Intervención humana en puntos definidos del flujo.
 *
 * La decisión de diseño NO es cómo pausar, sino CUÁNDO pausar.
 *
 * Aquí el gate es CONDICIONAL: la misma herramienta (`issueRefund`) se
 * ejecuta sola cuando la compra está dentro de política, y se detiene a
 * preguntar cuando se pasó del plazo. El agente no cambia; cambia la
 * condición que decide si hay que preguntar.
 */

import {
  generateText,
  stepCountIs,
  type ModelMessage,
  type ToolApprovalResponse,
} from 'ai';

import { createTracer, model } from '../../helpers/index.js';
import { trace } from 'node:console';
import { TOOL_APPROVAL } from './approval/tool-approval.js';
import { SUPPORT_INSTRUCTIONS } from './data/instructions.js';
import { REFUND_WINDOW_DAYS } from './data/purchases.js';
import { INBOX } from './data/tickets.js';
import { APPROVALS, LEDGER } from './ledger/ledger.js';
import { closeTerminal, review } from './review/terminal-review.js';
import { TOOLS } from './tools/refund-tools.js';

// ---------------------------------------------------------------------------
// EL BUCLE — cada gate parte el trabajo en dos llamadas al modelo
// ---------------------------------------------------------------------------

const MAX_ROUNDS = 6; // Este lo usaremos como circuit breaker manual.

export async function humanInTheLoopMain() {
  console.log('\n═══ HUMAN-IN-THE-LOOP ═══\n'.blue);
  console.log(
    `  Los reembolsos dentro de ${REFUND_WINDOW_DAYS} días se ejecutan solos.\n`
      .yellow +
      '  Fuera de plazo, el programa se detiene y te pregunta.\n'.yellow
  );

  const tracer = createTracer('hitl');

  const messages: ModelMessage[] = [{ role: 'user', content: INBOX }];
  let finalText = '';
  let gates = 0; // Los gates son las interrupciones del flujo de ejecución del modelo.

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const result = await generateText({
      model,
      messages,
      tools: TOOLS,
      toolApproval: TOOL_APPROVAL,
      instructions: SUPPORT_INSTRUCTIONS,
      stopWhen: stepCountIs(8),
      onStepEnd: tracer.onStepFinish,
    });

    // Mantener el historial de mensajes
    messages.push(...result.responseMessages);

    // Determinar si hay necesidad de intervención humana
    const requests = result.content.filter(
      (part) => part.type === 'tool-approval-request' && !part.isAutomatic
    );

    if (requests.length === 0) {
      finalText = result.text;
      break;
    }

    // Implementar el contador de gates y también el HITL
    gates++;
    console.log(`\n --- Gate ${gates} --- `.blue);

    const approvals: ToolApprovalResponse[] = [];

    for (const request of requests) {
      if (request.type !== 'tool-approval-request') continue;

      const { toolCallId, input } = request.toolCall;
      const verdict = await review(
        input as { purchaseId: string; reason: string }
      );

      if (verdict.approved) {
        APPROVALS.set(toolCallId, verdict.by);
      }

      approvals.push({
        type: 'tool-approval-response',
        approvalId: request.approvalId,
        approved: verdict.approved,
        reason: verdict.note,
      });
    }

    messages.push({ role: 'tool', content: approvals });
  }
  
  // Limpiar la terminal
  closeTerminal();

  console.log('\n Respuesta:', finalText.green);

  console.log('\n  Reembolsos ejecutados:'.blue);
  if (LEDGER.length === 0) {
    console.log('     (ninguno)');
  } else {
    for (const effect of LEDGER) {
      console.log(`     · ${effect.detail} | aprobó: ${effect.approvedBy}`);
    }
  }

  console.log(
    `\n  Gates abiertos: ${gates} · Pasos: ${tracer.summary().steps} · ` +
      `Tokens: ${tracer.summary().totalTokens}\n`
  );

  // Guard: sin tool call no hay gate, y el lab se vería "correcto"
  // sin haber probado nada. Mejor que lo diga en voz alta.
  if (gates === 0 && LEDGER.length === 0) {
    console.log(
      (
        '  ⚠️  El modelo no llamó a issueRefund ni una vez: resolvió los\n' +
        '      tickets en texto. No hubo nada que aprobar, así que el gate\n' +
        '      nunca se probó. Revisa las instrucciones o usa un modelo\n' +
        '      con mejor seguimiento de herramientas.\n'
      ).yellow
    );
  }

  console.log(
    '  El gate no hace más listo al agente: le quita la última palabra,\n' +
      '  y solo cuando la operación se sale de la política.\n\n' +
      '  Si pausaras en todo, el humano vuelve a ser el cuello de botella\n' +
      '  y el agente deja de aportar. Cada aprobación cuesta, además,\n' +
      '  una llamada extra al modelo.\n'
  );
}