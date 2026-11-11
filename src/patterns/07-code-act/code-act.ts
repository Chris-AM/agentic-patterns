/**
 * PATRÓN: CodeAct
 * ---------------
 * Origen: Wang et al., 2024 — "Executable Code Actions Elicit Better LLM Agents".
 *
 * En Tool Use (patrón 01) la acción del modelo es un JSON: un nombre de
 * herramienta y unos argumentos. Aquí la acción es CÓDIGO EJECUTABLE.
 *
 * La diferencia no es cosmética. El JSON no tiene `for`, no tiene `if`,
 * no tiene variables intermedias. Cada iteración de un bucle es un
 * round-trip completo al modelo. Con código, una sola acción hace lo que
 * en JSON exigiría treinta llamadas.
 *
 * EL PRECIO:
 * ==========================================================================
 *  Sin aislamiento real,
 *  "CodeAct no es un patrón agéntico, es una vulnerabilidad de
 *   ejecución remota con buenas intenciones."
 * ==========================================================================
 *
 * Este laboratorio tiene dos secciones:
 *
 *   A) Sin CodeAct   → herramientas atómicas encadenadas. NO puede terminar:
 *                      el enumerado exige ~30 pasos y el presupuesto son 10.
 *
 *   B) Con CodeAct   → el modelo escribe el algoritmo. Un paso.
 *
 */

import { generateText, stepCountIs } from 'ai';

import { createTracer, model, toolResultsOf } from '../../helpers/index.js';
import { HEROES } from './data/heroes.js';
import { HOURS_PER_OPERATION, MISSION } from './data/mission.js';
import { auditPlan, printAudit, type Plan } from './data/plan-checks.js';
import { VILLAINS } from './data/villains.js';
import { buildRunCodeTool, type RunCodeOutput } from './sandbox/run-code-tool.js';
// Ronda A (comentada): import { buildAtomicTools, planFromSteps } from './tools/atomic-tools.js';

// Presupuesto de pasos de la ronda A (ver el comentario en tools/atomic-tools.ts).
const STEP_BUDGET = 10;
// Límites de la ronda B: el núcleo los exige, esta instancia define el valor.
const CODE_ACT_STEP_BUDGET = 6;
const SANDBOX_TIMEOUT_MS = 1_000;

// ---------------------------------------------------------------------------
// A) SIN CODEACT — herramientas atómicas, una acción JSON por dato
// ---------------------------------------------------------------------------

/* async function withoutCodeAct() {
  console.log('\n═══ A) SIN CODEACT — acciones en JSON ═══\n'.blue);
  const tracer = createTracer('sin-codeact');
  const result = await generateText({
    model,
    prompt: MISSION,
    tools: buildAtomicTools(),
    stopWhen: stepCountIs(STEP_BUDGET),
    instructions:
      'Eres el coordinador del operativo. Responde en español. ' +
      'Recorre TODOS los villanos y TODOS los héroes con las herramientas ' +
      'antes de asignar. No inventes datos que no hayas consultado. ' +
      'Registra cada asignación con assignHero.',
    onStepEnd: tracer.onStepFinish,
  });

  const plan = planFromSteps(result.steps);

  console.log('\n Auditoría:'.blue);
  const score = printAudit(auditPlan(plan));

  console.log(
    (
      `\n  ⚠️  Presupuesto: ${STEP_BUDGET} pasos.` +
      '\n      Solo enumerar los 12 villanos con cursor ya consume 12.' +
      '\n      El JSON no sabe iterar: cada elemento es un viaje al modelo.'
    ).yellow
  );

  return { ...tracer.summary(), score };
}
 */
// ---------------------------------------------------------------------------
// B) CON CODEACT — la acción es un programa
// ---------------------------------------------------------------------------

async function withCodeAct() {
  console.log('\n═══ B) CON CODEACT — la acción es código ═══\n'.blue);
  const tracer = createTracer('con-codeact');

  const runCode = buildRunCodeTool({
    db: { villains: VILLAINS, heroes: HEROES, hoursPerOperation: HOURS_PER_OPERATION },
    timeoutMs: SANDBOX_TIMEOUT_MS,
    validate: (value) =>
      auditPlan(value as Plan)
        .filter((check) => !check.passed)
        .map((check) => check.label),
    failureHint:
      'Inspecciona los datos reales antes de asumir nada: ' +
      'haz un `return db.villains[0]` y mira qué campos trae. ' +
      'NO declares datos de prueba propios: db ya está cargado.',
  });

  const result = await generateText({
    model,
    prompt:
      MISSION +
      '\n\nEscribe UN único programa que resuelva todo el operativo y ' +
      'retorne exactamente este objeto:\n' +
      '{ assignments: { "<alias del héroe>": ["<alias villano>", ...] }, ' +
      'unhandled: ["<alias villano>", ...] }',
    tools: { runCode },
    stopWhen: stepCountIs(CODE_ACT_STEP_BUDGET),
    instructions:
      'Eres el coordinador del operativo. Responde en español. ' +
      'No razones el reparto villano a villano: escribe el algoritmo y ' +
      'deja que el sandbox lo ejecute. ' +
      'Los datos REALES ya están en `db` dentro del sandbox: nunca ' +
      'declares villanos ni héroes de prueba, y si dudas de la forma de ' +
      'un registro, inspecciónalo con un return. ' +
      'Si la herramienta reporta failedChecks, tu código tiene un bug: ' +
      'corrígelo y vuelve a ejecutar. No justifiques el resultado.',
    onStepEnd: tracer.onStepFinish,
  });

  // Mejora C: el último plan válido se lee de la traza, sin mutar `lastPlan`.
  const lastPlan =
    (toolResultsOf(result.steps, 'runCode')
      .map((r) => r.output as RunCodeOutput)
      .filter((output) => output.ok)
      .at(-1)?.value as Plan | undefined) ?? null;

  console.log('\n Plan devuelto por el sandbox:'.blue);
  console.log(JSON.stringify(lastPlan, null, 2));

  console.log('\n Auditoría:'.blue);
  const score = printAudit(auditPlan(lastPlan));

  console.log(
    (
      '\n  ✅ El bucle, el descuento de horas y el orden viven en el' +
      '\n     intérprete, no en la cabeza del modelo. El intérprete no' +
      '\n     olvida ni se equivoca al restar.'
    ).green
  );

  return { ...tracer.summary(), score };
}

// ---------------------------------------------------------------------------
// EJECUCIÓN DEL PROGRAMA
// ---------------------------------------------------------------------------

export async function codeActMain() {
  // const a = await withoutCodeAct();
  const b = await withCodeAct();

  console.log('\n═══ COMPARATIVA ═══\n'.blue);
  console.table({
    // 'Sin CodeAct (JSON)': a,
    'Con CodeAct': b,
  });

  console.log(
    '\n  CodeAct no ahorra tokens por ser más listo: los ahorra porque\n' +
      '  mueve el bucle del modelo al intérprete. Doce elementos o mil,\n' +
      '  el coste del razonamiento es el mismo'
  );
}