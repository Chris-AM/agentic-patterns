/**
 * PATRÓN: Paralelización - Parallelization
 * ----------------------------------------
 * Tres fases, cada una con un responsable claro:
 *
 *   1. PLANIFICAR  → un agente lee la petición y devuelve una lista de
 *                    investigaciones independientes (salida estructurada).
 *   2. EJECUTAR    → un worker por investigación, todos a la vez.
 *   3. INTEGRAR    → un agente recibe los hallazgos y redacta la salida.
 *
 * Lo que compra: latencia. Cuatro investigaciones tardan lo que tarda la
 * más lenta, no la suma de las cuatro.
 *
 * El coste oculto: los workers no se ven entre sí. Un multiplataforma
 * aparece en varias ramas y nadie puede evitarlo desde dentro. Por eso
 * la fase 3 no es opcional.
 *
 *   A) UN SOLO AGENTE  → busca y redacta él mismo, en serie.
 *   B) PLAN + FAN-OUT + INTEGRACIÓN
 *
 * REQUISITOS
 *   - Clave gratuita de RAWG: https://rawg.io/apidocs
 *   - export RAWG_API_KEY="..."
 */

import { generateText, stepCountIs } from 'ai';

import { createTracer, model } from '../../helpers/index.js';
import { trace } from 'node:console';
import { RESEARCH_REQUEST } from './data/research-request.js';
import { integrateFindings } from './phases/integrate.js';
import { planResearch } from './phases/plan.js';
import { runWorker } from './phases/run-worker.js';
import { RAWG_API_KEY, searchUpcomingGames } from './tools/search-upcoming-games.js';

// ---------------------------------------------------------------------------
// A) UN SOLO AGENTE — busca y redacta él mismo
// ---------------------------------------------------------------------------

async function singleAgent() {
  console.log('\n═══ A) UN SOLO AGENTE ═══\n'.blue);
  const tracer = createTracer('agente-único');
  const startedAt = Date.now();

  const { text } = await generateText({
    model,
    tools: { searchUpcomingGames },
    stopWhen: stepCountIs(8),
    instructions:
      'Eres redactor de una newsletter de videojuegos. Consulta la ' +
      'herramienta para cada plataforma que te pidan y redacta un repaso ' +
      'de máximo 200 palabras con los 2 lanzamientos más relevantes de ' +
      'cada una. Responde en español.',
    prompt: RESEARCH_REQUEST,
    onStepEnd: tracer.onStepFinish,
  });

  console.log(text.green);

  return { ...tracer.summary(), ms: Date.now() - startedAt };
}

// ---------------------------------------------------------------------------
// B) PLANIFICAR → EJECUTAR EN PARALELO → INTEGRAR
// ---------------------------------------------------------------------------

// ----- Las tres fases juntas -----------------------------------------------

async function planExecuteIntegrate() {
  console.log('\n═══ B) PLAN → PARALELO → INTEGRACIÓN ═══\n'.blue);

  const tracer = createTracer('paralelo');
  const startedAt = Date.now();

  // 1. Planificar
  const tasks = await planResearch(tracer);

  console.log(` Plan: ${tasks.length} investigaciones`.blue);
  for (const task of tasks) {
    console.log(`   · ${task.topic.yellow}: ${task.assignment}`);
  }

  // 2. Ejecutar en paralelo — aquí es donde se gana la latencia
  const workersStartedAt = Date.now();

  const findings = await Promise.all(
    tasks.map(async (task) => {
      console.log(`\n --> worker [${task.topic.yellow}] arranca`);
      const result = await runWorker(task.assignment, tracer);
      console.log(`\n <-- worker [${task.topic.yellow}] termina`);

      return { topic: task.topic, findings: result };
    })
  );

  const workersMs = Date.now() - workersStartedAt;

  // 3. Integrar
  const report = await integrateFindings(findings, tracer);

  console.log('\n Informe integrado:\n'.blue);
  console.log(report.green);

  return {
    ...tracer.summary(),
    ms: Date.now() - startedAt,
    workersMs,
    workers: tasks.length,
  };
}

// ---------------------------------------------------------------------------
// EJECUCIÓN DEL PROGRAMA
// ---------------------------------------------------------------------------

export async function parallelizationMain() {
  if (!RAWG_API_KEY) {
    console.error(
      '\n  Falta RAWG_API_KEY (gratuita en rawg.io/apidocs).\n'.red
    );
    return;
  }

  const a = await singleAgent();
  const b = await planExecuteIntegrate();

  console.log('\n═══ COMPARATIVA ═══\n'.blue);
  console.table({
    'A) Agente único': a,
    'B) Plan + paralelo + integración': b,
  });
}