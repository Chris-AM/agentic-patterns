/**
 * PATRÓN: Planificación - Planning
 * --------------------------------
 * El modelo descompone la tarea en pasos ANTES de ejecutar.
 *
 * Sin planificación, el modelo intenta resolver todo de una vez y pierde
 * restricciones por el camino: manda un héroe que no contrarresta el poder
 * del villano, se pasa de las horas disponibles, o captura a un villano
 * después de que otro ya haya liberado a media prisión.
 *
 * Con planificación, cada paso resuelve una sola cosa y arrastra el
 * resultado al siguiente.
 *
 */

import { generateText } from "ai";

import { createTracer, model } from "../../helpers/index.js";
import { MISSION } from "./data/mission.js";
import { buildPlan } from "./planifications/build-plan.js";

// ---------------------------------------------------------------------------
// A) SIN PLANIFICACIÓN — una sola llamada, todo de golpe
// ---------------------------------------------------------------------------
// TODO:
async function withoutPlanning() {
  console.log("\n═══ A) SIN PLANIFICACIÓN ═══\n".blue);

  const tracer = createTracer("sin-planificación");

  const { text } = await generateText({
    model,
    prompt: MISSION,
    onStepEnd: tracer.onStepFinish,
  });

  console.log("\n Respuesta:", text.green);

  console.log(
    (
      "\n  ⚠️  Verifica: ¿va Mirror Master primero?" +
      "\n      ¿cada héroe contrarresta de verdad el poder asignado?" +
      "\n      ¿son atrapados en orden de amenaza?" +
      "\n      ¿alguien supera sus horas disponibles?"
    ).yellow,
  );

  return tracer.summary();
}

// ---------------------------------------------------------------------------
// B) CON PLANIFICACIÓN — primero el plan, luego la ejecución
// ---------------------------------------------------------------------------
async function withPlanning() {
  console.log("==== B) Con planificación ======".blue);
  const tracer = createTracer("con-planificación");

  // Fase 1: Planificación y construir el plan
  const steps = await buildPlan(MISSION, tracer);
  // Fase 2: Ejecutar paso por paso
  const findings: string[] = [];

  for (const [index, step] of steps.entries()) {
    console.log(`\n --> 📋 Ejecutando paso ${index + 1}: ${step.goal}`.blue);

    const { text } = await generateText({
      model,
      instructions:
        "Resuelve únicamente el paso indicado." +
        "No te adelantes a los siguientes pasos ni des el operativo final. ",
      prompt:
        `Misión original: ${MISSION} \n\n` +
        (findings.length
          ? `Resuelto hasta ahora: ${findings.join("\n----\n")}\n\n`
          : "") + 
          `Paso actual: ${step.goal}`,
      onStepEnd: tracer.onStepFinish,
    });

    findings.push(`[${step.goal}]\n ${text.trim()}`);
  }
  
  // Fase 3: Sintetizar e integrar todos los pasos anteriores =====
  const { text: finalPlan } = await generateText({
    model,
    instructions:
      'Integra los resultados parciales en un operativo final.' +
      'Se concreto: Orden de intervención y de prioridades. ',
    prompt:
      `MISIÓN:  \n${MISSION} \n\n` +
      `RESULTADOS PARCIALES: \n ${findings.join('\n---\n')}`,
    onStepEnd: tracer.onStepFinish,
  });

  console.log('\n\nOperativo final:', finalPlan.green);

  return tracer.summary();
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
// TODO:
export async function planningMain() {
  // const a = await withoutPlanning();
  const b = await withPlanning();

  console.log("\n═══ COMPARATIVA ═══\n".blue);
  console.table({
    // 'Sin planificación': a,
    "Con planificación": b,
  });

  console.log(
    "\n  Planificar cuesta más llamadas y más tokens.\n" +
      "  Lo que compra es que las restricciones sobrevivan hasta el final.\n" +
      "  Si no hay restricciones que perder, no compra nada.\n",
  );
}
