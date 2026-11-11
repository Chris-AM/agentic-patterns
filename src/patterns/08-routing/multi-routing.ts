/**
 * PATRÓN: Enrutamiento - Router & Specialist Routing
 * ---------------------------------------------------
 * La centralita telefónica de DevTalles. Cada llamada entra, un
 * clasificador decide UNA sola vez a qué departamento va, y se retira.
 * No es un orquestador: no reintenta ni vuelve a tomar el control.
 *
 *   A) Sin router        → una sola persona atiende todo con todas las tools
 *   B) Con router        → clasificar → transferir → fin
 *
 * Garantía estructural: cada departamento tiene UNA herramienta y son
 * disjuntas. Una llamada transferida al departamento equivocado no puede
 * resolverse: nadie ahí tiene la herramienta. No es "probablemente falle",
 * es imposible por construcción.
 */

import { generateText, stepCountIs } from 'ai';

import { createTracer, model } from '../../helpers/index.js';
import { trace } from 'node:console';
import { auditCalls, toolNamesOf, type Check } from './data/call-checks.js';
import { CALLS } from './data/calls.js';
import { DEPARTMENTS, FALLBACK, type Department } from './data/departments.js';
import { classify } from './router/classify.js';
import { openTicket, resendInvoice, sendCatalog } from './tools/department-tools.js';

// ---------------------------------------------------------------------------
// A) SIN ROUTER — una sola persona atiende todo
// ---------------------------------------------------------------------------

const GENERALIST_INSTRUCTIONS =
  'Eres el único operador de la centralita de DevTalles. Atiendes cualquier llamada.\n' +
  Object.values(DEPARTMENTS)
    .map((department) => `- ${department.instructions}`)
    .join('\n');
/*
 * Ejemplo: 
  Eres el único operador de la centralita de DevTalles. Atiendes cualquier llamada.
  - Cursos disponibles, precios, descuentos, promociones.
  - Problemas de acceso, videos que no cargan, errores de la plataforma.
  - Facturas, cobros duplicados, comprobantes de pago.
*/

const ALL_TOOLS = { sendCatalog, openTicket, resendInvoice };

/* async function withoutRouter() {
  console.log('\n═══ A) SIN ROUTER (un solo operador) ═══\n'.blue);
  const tracer = createTracer('sin-router');
  const checks: Check[] = [];

  for (const call of CALLS) {
    console.log(`\n ☎️ Llamada # ${call.id}: ${call.text}`.blue);

    // TODO: Tarea: instrucciones, all tools, stepCountIs 3
    const { text, steps } = await generateText({
      model,
      instructions: GENERALIST_INSTRUCTIONS,
      prompt: call.text,
      tools: ALL_TOOLS,
      stopWhen: stepCountIs(3),
      onStepEnd: tracer.onStepFinish,
    });

    console.log(`     Respuesta: ${text.trim()}`.green);

    checks.push({
      callId: call.id,
      expected: call.expected,
      routedTo: 'Operador único',
      toolsUsed: toolNamesOf(steps),
    });
  }

  const accuracy = auditCalls(checks);

  console.log(
    (
      '\n  ⚠️  Puede acertar. Pero cada llamada cargó las instrucciones de los ' +
      `3 departamentos (${GENERALIST_INSTRUCTIONS.length} caracteres) y las 3 tools.\n` +
      '      Con 30 departamentos, ese coste fijo se multiplica por 10.'
    ).yellow
  );

  return { ...tracer.summary(), accuracy };
}
 */
// ---------------------------------------------------------------------------
// B) CON ROUTER — clasificar una vez, transferir, fin
// ---------------------------------------------------------------------------

async function withRouter() {
  console.log('\n═══ B) CON ROUTER ═══\n'.blue);
  const tracer = createTracer('con-router');
  const checks: Check[] = [];

  const categories: Record<Department, string> = Object.fromEntries(
    Object.entries(DEPARTMENTS).map(([name, d]) => [name, d.description])
  ) as Record<Department, string>;

  for (const call of CALLS) {
    console.log(`\n ☎️ Llamada #${call.id}: ${call.text}`.blue);

    // 1. Clasificar (una sola vez)
    const decision = await classify(call.text, categories, FALLBACK, tracer);
    console.log(
      `     Centralita → ${decision.department} · ${decision.reason}`.purple
    );

    // Fallback: lo resuelve el código, sin modelo ni herramientas.
    if (decision.department === FALLBACK.route) {
      console.log('     Derivada a una persona (fallback).'.yellow);
      checks.push({
        callId: call.id,
        expected: call.expected,
        routedTo: FALLBACK.route,
        toolsUsed: [],
      });
      continue;
    }

    // 2. Transferir: el departamento solo ve SU instrucción y SU herramienta.
    //    La centralita ya no participa.
    const department = DEPARTMENTS[decision.department];

    const { text, steps } = await generateText({
      model,
      instructions: department.instructions,
      prompt: call.text,
      tools: department.tools,
      stopWhen: stepCountIs(3),
      onStepEnd: tracer.onStepFinish,
    });

    console.log(` Especialista Respuesta -> ${text.trim()}`.green);

    // Agregar la respuesta a la auditoría.
    checks.push({
      callId: call.id,
      expected: call.expected,
      routedTo: decision.department,
      toolsUsed: toolNamesOf(steps),
    });
  }

  console.log('\n Auditoría:'.blue);
  const accuracy = auditCalls(checks);

  const longest = Math.max(
    ...Object.values(DEPARTMENTS).map((d) => d.instructions.length)
  );
  console.log(
    (
      `\n  Cada llamada cargó como mucho ${longest} caracteres y 1 tool ` +
      `(vs ${GENERALIST_INSTRUCTIONS.length} y 3 del operador único).\n` +
      '  Con 30 departamentos, el coste por llamada NO cambia.'
    ).yellow
  );

  return { ...tracer.summary(), accuracy };
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

export async function routingMain() {
  // const a = await withoutRouter();
  const b = await withRouter();

  console.log('\n═══ COMPARATIVA ═══\n'.blue);
  console.table({
    // 'Sin router (operador único)': a,
    'Con router': b,
  });

  console.log(
    '\n  El router cuesta una llamada extra, pero es diminuta.\n' +
      '  Lo que compra es que cada departamento cargue solo su contexto y\n' +
      '  su herramienta: el coste crece con el departamento, no con cuántos hay.\n\n' +
      '  La centralita clasifica y transfiere UNA vez; no retiene el control.\n' +
      '  Si hace falta coordinar varios departamentos o juntar sus respuestas,\n' +
      '  eso ya es otro patrón: el orquestador multi-agente.\n'
  );
}