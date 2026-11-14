import {
  generateText,
  stepCountIs,
  type GenerateTextStepEndEvent,
  type LanguageModel,
  type ModelMessage,
  type ToolApprovalResponse,
  type ToolSet,
} from 'ai';

import type { Ledger } from '../ledger/ledger.js';
import type { Reviewer, ReviewRequest } from '../review/reviewer.js';

// ---------------------------------------------------------------------------
// EL BUCLE — cada gate parte el trabajo en dos llamadas al modelo
// ---------------------------------------------------------------------------
/**
 * Extraído de la composición para poder probarlo sin terminal (mejora 4):
 * recibe el modelo, el revisor y el libro de la corrida por parámetro.
 * Mejora 6: los techos son obligatorios y el corte por rondas se hace visible.
 */
export type HitlLimits = { maxRounds: number; stepsPerRound: number };

export type HitlOptions = {
  model: LanguageModel;
  tools: ToolSet;
  toolApproval: Parameters<typeof generateText>[0]['toolApproval'];
  instructions: string;
  inbox: string;
  reviewer: Reviewer;
  ledger: Ledger;
  limits: HitlLimits;
  tracer: { onStepFinish: (event: GenerateTextStepEndEvent) => void };
};

export async function runHitl(options: HitlOptions) {
  const { model, tools, toolApproval, instructions, inbox, reviewer, ledger, limits, tracer } = options;

  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new RangeError(`limits.${name} debe ser un entero mayor que 0 (recibido: ${value})`);
    }
  }

  const messages: ModelMessage[] = [{ role: 'user', content: inbox }];
  let finalText = '';
  let gates = 0; // Los gates son las interrupciones del flujo de ejecución del modelo.
  let hitRoundLimit = true;

  for (let round = 1; round <= limits.maxRounds; round++) {
    const result = await generateText({
      model,
      messages,
      tools,
      toolApproval,
      instructions,
      stopWhen: stepCountIs(limits.stepsPerRound),
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
      hitRoundLimit = false;
      break;
    }

    gates++;
    console.log(`\n --- Gate ${gates} --- `.blue);

    const approvals: ToolApprovalResponse[] = [];

    for (const request of requests) {
      if (request.type !== 'tool-approval-request') continue;

      const { toolCallId, input } = request.toolCall;
      const reviewRequest = input as ReviewRequest;
      const verdict = await reviewer.review(reviewRequest);

      // Mejora 3: toda decisión humana queda registrada, aprobada o no.
      ledger.recordDecision({
        toolCallId,
        purchaseId: reviewRequest.purchaseId,
        approved: verdict.approved,
        by: verdict.by,
        category: verdict.category,
        internalNote: verdict.internalNote,
      });

      if (verdict.approved) ledger.approve(toolCallId, verdict.by);

      approvals.push({
        type: 'tool-approval-response',
        approvalId: request.approvalId,
        approved: verdict.approved,
        // Al modelo solo le llega el mensaje para el cliente, nunca la nota interna.
        reason: verdict.approved ? verdict.customerMessage || 'Aprobado' : verdict.customerMessage,
      });
    }

    messages.push({ role: 'tool', content: approvals });
  }

  return { finalText, gates, hitRoundLimit };
}
