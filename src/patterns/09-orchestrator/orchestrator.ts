/**
 * PATRÓN: Orquestador y trabajadores - Orchestrator-Workers
 * ----------------------------------------------------------
 * La misma centralita de DevTalles del laboratorio anterior, pero ahora
 * entra UNA llamada que necesita a tres departamentos a la vez.
 *
 *   A) Router (patrón anterior) → transfiere una vez y se retira → techo: 1 de 3
 *   B) Orquestador               → UN agente cuyas herramientas son los workers
 *
 * Diferencia clave con el router: el router llama al modelo una vez y suelta.
 * El orquestador es UN SOLO bucle agéntico: el mismo modelo, en la misma
 * conversación, decide a quién delegar, ve lo que vuelve y escribe la
 * respuesta final. Mantiene el control porque no sale de la conversación
 * hasta que él decide que terminó.
 *
 * Garantía estructural: el router transfiere a UN departamento con UNA
 * tool, así que resuelve como mucho 1 de 3 partes. No es probable:
 * es aritmético.
 */

import { generateText, stepCountIs, Output } from 'ai';
import { z } from 'zod';

import { createTracer, model } from '../../helpers/index.js';
import { trace } from 'node:console';
import { auditAnswer, printAudit } from './data/answer-checks.js';
import { COMPOUND_CALL } from './data/compound-call.js';
import { DEPARTMENT_LIST, DEPARTMENT_NAMES } from './data/departments.js';
import { delegateTo } from './delegation/delegate-to.js';
import { runWorker } from './workers/run-worker.js';

// ---------------------------------------------------------------------------
// A) ROUTER — el patrón anterior, frente a una llamada que no le cabe
// ---------------------------------------------------------------------------

async function withRouter() {
  console.log('\n═══ A) ROUTER — transfiere una vez y se retira ═══\n'.blue);
  const tracer = createTracer('router');

  console.log(` ☎️ Llamada: ${COMPOUND_CALL}`.blue);

  // 1. Clasificar (una sola vez)
  const { output: decision } = await generateText({
    model,
    output: Output.object({
      schema: z.object({
        department: z.enum(DEPARTMENT_NAMES),
        reason: z
          .string()
          .describe('Una frase del por qué va a ese departamento'),
      }),
    }),
    instructions:
      'Eres un centralista. Transfiere la llamada a un único departamento: \n' +
      DEPARTMENT_LIST,
    prompt: COMPOUND_CALL,
    onStepEnd: tracer.onStepFinish,
  });

  console.log(
    `\n     Centralita → ${decision.department} · ${decision.reason}`.purple
  );

  // 2. Transferir. La centralita ya no participa.
  const answer = await runWorker(decision.department, COMPOUND_CALL, tracer);

  const accuracy = printAudit(auditAnswer(answer));

  console.log(
    (
      '\n  ⚠️  El router transfirió a UN departamento con UNA tool.\n' +
      '      Las otras dos partes de la llamada se perdieron por construcción:\n' +
      '      nadie las vio, y el router ya no está para darse cuenta.'
    ).yellow
  );

  return { ...tracer.summary(), accuracy };
}

// ---------------------------------------------------------------------------
// B) ORQUESTADOR — un solo agente cuyas herramientas son los workers
// ---------------------------------------------------------------------------

async function withOrchestrator() {
  console.log('\n═══ B) ORQUESTADOR — mantiene el control ═══\n'.blue);
  const tracer = createTracer('orquestador');

  console.log(` ☎️ Llamada: ${COMPOUND_CALL}`.blue);

  const { text } = await generateText({
    model,
    instructions:
      'Eres el supervisor de la centralita de DevTalles. No atiendes al ' +
      'cliente directamente: delega cada parte de la llamada al departamento ' +
      'correspondiente con tus herramientas. Puedes delegar a varios. ' +
      'Cuando todo esté resuelto, redacta UNA sola respuesta al cliente ' +
      'integrando los resultados y conservando los identificadores exactos ' +
      '(facturas, tickets, catálogos). Responde en español, máximo 120 palabras.',
    prompt: COMPOUND_CALL,
    tools: {
      delegateToVentas: delegateTo('ventas', tracer),
      delegateToSoporte: delegateTo('soporte', tracer),
      delegateToFacturacion: delegateTo('facturacion', tracer),
    },
    stopWhen: stepCountIs(8),
    onStepEnd: tracer.onStepFinish,
  });

  console.log('\n Respuesta final al cliente:'.blue);
  console.log(`     ${text.trim()}`.green);

  console.log('\n Auditoría:'.blue);
  const accuracy = printAudit(auditAnswer(text));

  return { ...tracer.summary(), accuracy };
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

export async function orchestratorWorkersMain() {
  // const a = await withRouter();
  const b = await withOrchestrator();

  console.log('\n═══ COMPARATIVA ═══\n'.blue);
  console.table({
    // Router: a,
    Orquestador: b,
  });

  console.log(
    '\n  El router llama al modelo una vez y suelta. El orquestador es un\n' +
      '  bucle que no termina hasta que el propio modelo decide que terminó:\n' +
      '  reparte, ve lo que vuelve, vuelve a repartir y junta las piezas.\n\n' +
      '  Eso lo hace el más caro de los patrones multi-agente. Compra\n' +
      '  resolver tareas que ningún especialista puede resolver solo.\n' +
      '  Si la tarea cabe en un especialista, un router es suficiente.\n'
  );
}