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

import { createTracer, model } from '../../helpers/index.js';
import { trace } from 'node:console';
import { buildToolApproval } from './approval/tool-approval.js';
import { SUPPORT_INSTRUCTIONS } from './data/instructions.js';
import { PURCHASES, REFUND_WINDOW_DAYS } from './data/purchases.js';
import { INBOX } from './data/tickets.js';
import { createLedger } from './ledger/ledger.js';
import { runHitl } from './loop/run-hitl.js';
import { terminalReviewer } from './review/terminal-review.js';
import { buildRefundTools } from './tools/refund-tools.js';

// ---------------------------------------------------------------------------
// CONFIGURACIÓN DE LA INSTANCIA — el núcleo exige los valores, aquí se definen
// ---------------------------------------------------------------------------

/** La política NO decide: solo marca qué necesita una firma humana. */
const POLICY = {
  refundWindowDays: REFUND_WINDOW_DAYS, // única fuente de verdad: el mismo valor que muestra el panel
  maxRefundsPerRun: 5, // techo agregado: cantidad por corrida
  maxRefundUSDPerRun: 200, // techo agregado: monto por corrida
};

// MAX_ROUNDS del docente: lo usaremos como circuit breaker manual.
const LIMITS = { maxRounds: 6, stepsPerRound: 8 };

export async function humanInTheLoopMain() {
  console.log('\n═══ HUMAN-IN-THE-LOOP ═══\n'.blue);
  console.log(
    `  Los reembolsos dentro de ${POLICY.refundWindowDays} días se ejecutan solos.\n`
      .yellow +
      '  Fuera de plazo, el programa se detiene y te pregunta.\n'.yellow
  );

  const tracer = createTracer('hitl');
  // Un libro mayor por corrida (mejora 2): nada se arrastra entre ejecuciones.
  const ledger = createLedger();

  const { finalText, gates, hitRoundLimit } = await runHitl({
    model,
    tools: buildRefundTools({ purchases: PURCHASES, ledger }),
    toolApproval: buildToolApproval({ purchases: PURCHASES, ledger, policy: POLICY }),
    instructions: SUPPORT_INSTRUCTIONS,
    inbox: INBOX,
    reviewer: terminalReviewer,
    ledger,
    limits: LIMITS,
    tracer,
  });

  // Limpiar la terminal
  terminalReviewer.close?.();

  console.log('\n Respuesta:', finalText.green);

  console.log('\n  Reembolsos ejecutados:'.blue);
  const effects = ledger.effects();
  if (effects.length === 0) {
    console.log('     (ninguno)');
  } else {
    for (const effect of effects) {
      console.log(`     · ${effect.detail} | aprobó: ${effect.approvedBy}`);
    }
  }

  console.log(
    `\n  Gates abiertos: ${gates} · Pasos: ${tracer.summary().steps} · ` +
      `Tokens: ${tracer.summary().totalTokens}\n`
  );

  // Mejora 3: todas las decisiones (aprobadas, rechazadas y automáticas).
  console.log('  Decisiones registradas:'.blue);
  for (const decision of ledger.decisions()) {
    const mark = decision.approved ? '✓'.green : '✗'.red;
    console.log(`     ${mark} ${decision.purchaseId} · ${decision.category} · ${decision.by}`);
  }

  // Mejora 6: el corte por techo de rondas nunca es silencioso.
  if (hitRoundLimit) {
    console.log(`\n  ⚠️  Se agotaron las ${LIMITS.maxRounds} rondas sin una respuesta final.\n`.red);
  }

  // Guard: sin tool call no hay gate, y el lab se vería "correcto"
  // sin haber probado nada. Mejor que lo diga en voz alta.
  if (gates === 0 && effects.length === 0) {
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