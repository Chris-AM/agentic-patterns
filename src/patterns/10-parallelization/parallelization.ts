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
import { SINGLE_AGENT_INSTRUCTIONS, VIDEOGAME_PROMPTS } from './data/prompts.js';
import { RESEARCH_REQUEST, WINDOW_DAYS } from './data/research-request.js';
import { createPhases } from './phases/create-phases.js';
import { PLATFORMS, RAWG_API_KEY, searchUpcomingGames } from './tools/search-upcoming-games.js';

// Límites de esta instancia: el núcleo los valida, aquí se define el valor.
const SINGLE_AGENT_STEP_BUDGET = 8;
const LIMITS = { maxTasks: 8, workerSteps: 4 };

/**
 * Hechos fijos de la corrida, calculados UNA vez por el código. Todas las
 * fases comparten la misma referencia temporal (autocontención): el modelo
 * no conoce la fecha de hoy y «próximos 90 días» no se puede resolver sin ella.
 */
function runFacts(now = new Date()) {
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const until = new Date(now.getTime() + WINDOW_DAYS * 86_400_000);
  return {
    hoy: iso(now),
    'ventana de búsqueda': `${iso(now)} → ${iso(until)} (${WINDOW_DAYS} días)`,
  };
}

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
    stopWhen: stepCountIs(SINGLE_AGENT_STEP_BUDGET),
    instructions: SINGLE_AGENT_INSTRUCTIONS,
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

  // El contexto (tracer, límites, prompts del caso, tools) se inyecta UNA vez.
  // Resuelve el «//!» sobre el envío del tracer y los prompts fijos.
  const phases = createPhases({
    tracer,
    limits: LIMITS,
    prompts: VIDEOGAME_PROMPTS,
    tools: { searchUpcomingGames },
    subjects: Object.keys(PLATFORMS),
    facts: runFacts(),
  });

  // 1. Planificar
  const tasks = await phases.plan(RESEARCH_REQUEST);

  console.log(` Plan: ${tasks.length} investigaciones`.blue);
  for (const task of tasks) {
    console.log(`   · ${task.topic.yellow} [${task.subject}]: ${task.assignment}`);
  }

  // 2. Ejecutar en paralelo — aquí es donde se gana la latencia
  const workersStartedAt = Date.now();

  const findings = await Promise.all(
    tasks.map(async (task) => {
      console.log(`\n --> worker [${task.topic.yellow}] arranca`);
      const { notes, data } = await phases.runWorker(task);
      console.log(`\n <-- worker [${task.topic.yellow}] termina`);

      return { topic: task.topic, subject: task.subject, notes, data };
    })
  );

  const workersMs = Date.now() - workersStartedAt;

  // 3. Integrar
  const report = await phases.integrate(RESEARCH_REQUEST, findings);

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

  // const a = await singleAgent();
  const b = await planExecuteIntegrate();

  console.log('\n═══ COMPARATIVA ═══\n'.blue);
  console.table({
    // 'A) Agente único': a,
    'B) Plan + paralelo + integración': b,
  });
}