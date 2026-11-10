/**
 * PATRÓN: Planificar y ejecutar - Plan-and-Execute
 * ------------------------------------------------
 * Separa la planificación de la ejecución en dos fases distintas.
 *
 * En ReAct (patrón 04) el modelo decide UNA acción, ve el resultado,
 * decide la siguiente... una llamada al modelo por cada paso.
 *
 * En Plan-and-Execute el modelo produce el plan COMPLETO en una sola
 * llamada. Luego el código ejecuta las herramientas sin consultar al
 * modelo, y al final una única llamada redacta la respuesta.
 *
 * Diferencia con Planning (patrón 02): allí cada paso lo resolvía el
 * modelo. Aquí los pasos son llamadas a herramientas que ejecuta el código.
 *
 *   A) ReAct            → muchas llamadas, se adapta a lo que ve
 *   B) Plan-and-Execute → 2 llamadas, ciego a los resultados intermedios
 *   C) Cuando se rompe  → la tarea depende de un resultado intermedio
 */

import { generateText, stepCountIs } from 'ai';

import { createTracer, model } from '../../helpers/index.js';
import { auditReport } from './data/report-checks.js';
import { ADAPTIVE_TASK, PREDICTABLE_TASK } from './data/tasks.js';
import { executePlan } from './phases/execute.js';
import { buildPlan } from './phases/plan.js';
import { synthesizeReport } from './phases/synthesize.js';
import { prisonTool } from './tools/prison-tools.js';

// ---------------------------------------------------------------------------
// A) REACT — una llamada al modelo por cada acción
// ---------------------------------------------------------------------------

async function withReAct(task: string) {
  console.log('\n═══ A) REACT ═══\n'.blue);
  const tracer = createTracer('react');

  const { text } = await generateText({
    model,
    tools: prisonTool,
    prompt: task,
    stopWhen: stepCountIs(15),
    instructions:
      'Eres un oficial de control de prisión.' +
      'Consulta siempre las herramientas. No inventes datos. ',
    onStepEnd: tracer.onStepFinish,
  });

  console.log('\n Informe:'.blue, text.green);
  return { ...tracer.summary(), text }; // text
}

// ---------------------------------------------------------------------------
// B) PLAN-AND-EXECUTE — plan completo en una llamada, ejecución sin modelo
// ---------------------------------------------------------------------------

async function withPlanAndExecute(task: string) {
  console.log('\n═══ B) PLAN-AND-EXECUTE ═══\n'.blue);
  const tracer = createTracer('plan-and-execute');

  // Fase 1: PLANIFICAR — una sola llamada, sin herramientas
  const plan = await buildPlan(task, tracer);

  // TODO: Aquí les dejo el console.log para observar el plan
  console.log(`\n Plan (${plan.steps.length} pasos):`.blue);
  plan.steps.forEach((step, i) =>
    console.log(`   ${i + 1}. ${step.tool}(${step.villain}) — ${step.why}`)
  );

  // Fase 2: EJECUTAR — el código recorre el plan. Cero llamadas al modelo.
  const results = executePlan(plan);

  console.log('\n Ejecución completada sin consultar al modelo.'.yellow);

  // Fase 3: SINTETIZAR — una sola llamada con todos los resultados
  const text = await synthesizeReport(task, results, tracer);

  console.log('\n\n Informe:'.blue);
  console.log(`\n${text}`.green);

  return { ...tracer.summary(), text }; // text
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

export async function planAndExecuteMain() {
  // console.log('\n##### TAREA PREDECIBLE #####'.blue);
  // const a = await withReAct(PREDICTABLE_TASK);
  // const b = await withPlanAndExecute(PREDICTABLE_TASK);

  console.log('\n##### TAREA ADAPTATIVA #####'.blue);
  const c = await withReAct(ADAPTIVE_TASK);
  console.log('\n Auditoría ReAct:'.blue);
  const scoreC = auditReport(c.text);

  const d = await withPlanAndExecute(ADAPTIVE_TASK);
  console.log('\n Auditoría Plan-and-Execute:'.blue);
  const scoreD = auditReport(d.text);

  console.log('\n═══ COMPARATIVA ═══\n'.blue);
  console.table({
    // 'ReAct (predecible)': { steps: a.steps, totalTokens: a.totalTokens },
    // 'Plan-and-Execute (predecible)': {
    //   steps: b.steps,
    //   totalTokens: b.totalTokens,
    // },
    'ReAct (adaptativa)': {
      steps: c.steps,
      totalTokens: c.totalTokens,
      score: scoreC,
    },
    'Plan-and-Execute (adaptativa)': {
      steps: d.steps,
      totalTokens: d.totalTokens,
      score: scoreD,
    },
  });

  console.log(
    '\n  Plan-and-Execute compra coste: menos llamadas, menos tokens.\n' +
      '  Lo paga con adaptabilidad: el plan se decide antes de ver ningún dato.\n' +
      '  Si un paso depende del resultado de otro, vuelve a ReAct.\n'
  );
}
