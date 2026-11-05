/**
 * PATRÓN: Reflexión - Reflection
 * ------------------------------
 * El modelo evalúa su propia salida y la refina.
 *
 * La trampa del patrón: un modelo que se auto-evalúa SIN criterios
 * tiende a aprobarse. Este laboratorio lo demuestra en tres rondas:
 *
 *   A) Sin reflexión         → una sola pasada
 *   B) Reflexión ingenua     → "¿está bien?" → casi siempre dice que sí
 *   C) Reflexión con rúbrica → criterios explícitos → mejora real
 *
 * El juez programático del final es la pieza clave: dice la verdad
 * aunque el modelo se haya dado el visto bueno a sí mismo.
 */

import { generateText } from 'ai';

import { createTracer, model } from '../../helpers/index.js';
import { auditBriefing } from './data/briefing-checks.js';
import { REQUIREMENTS, TASK, VILLAIN_DOSSIER } from './data/task.js';
import { printAudit } from './judges/audit.js';
import { critique as critiqueDraft } from './reflections/critique.js';
import { naiveVerdict } from './reflections/naive-verdict.js';
import { revise } from './reflections/revise.js';

// ---------------------------------------------------------------------------
// A) SIN REFLEXIÓN — una sola pasada
// ---------------------------------------------------------------------------

async function withoutReflection() {
  console.log('\n═══ A) SIN REFLEXIÓN ═══\n'.blue);
  const tracer = createTracer('sin-reflexión');

  const { text } = await generateText({
    model,
    prompt: TASK,
    onStepEnd: tracer.onStepFinish,
  });

  console.log(text.green);
  console.log('\n Auditoría: \n');
  const score = printAudit(auditBriefing(text));

  return { ...tracer.summary(), score };
}

// ---------------------------------------------------------------------------
// B) REFLEXIÓN INGENUA — el modelo se pregunta "¿está bien?"
// ---------------------------------------------------------------------------

async function naiveReflection() {
  console.log('\n═══ B) REFLEXIÓN INGENUA (sin criterios) ═══\n'.blue);
  const tracer = createTracer('naive-reflection');

  const { text: draft } = await generateText({
    model,
    prompt: TASK,
    onStepEnd: tracer.onStepFinish,
  });

  // La auto-evaluación: Sin rúbrica, sin criterios, sin nada
  const verdict = await naiveVerdict(draft, tracer);

  console.log('Informe:'.blue);
  console.log(
    `Veredicto del modelo: ${
      verdict.isGoodEnough ? '✅ Está listo' : '⚠️ Necesita cambios'
    }`
  );
  console.log(`   Comentario: ${verdict.comment}`);

  console.log('  REALIDAD: (auditoria programática:'.blue);
  const score = printAudit(auditBriefing(draft));

  console.log(
    '\n  ⚠️  Compara el veredicto del modelo con la auditoría.'.yellow +
      '\n      Esta brecha es la razón de ser de la rúbrica.\n'
  );

  return { ...tracer.summary(), score }; // score
}

// ---------------------------------------------------------------------------
// C) REFLEXIÓN CON RÚBRICA — criterios explícitos e iteración
// ---------------------------------------------------------------------------

const MAX_ITERATIONS = 3;

async function reflectionWithRubric() {
  console.log('\n═══ C) REFLEXIÓN CON RÚBRICA ═══\n'.blue);
  const tracer = createTracer('con-rúbrica-reflexión');

  let draft = '';
  let iteration = 0;

  const { text: firstDraft } = await generateText({
    model,
    prompt: TASK,
    onStepEnd: tracer.onStepFinish,
  });

  draft = firstDraft;

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    console.log(`\n --- Iteración ${iteration} --- \n`.blue);

    const critique = await critiqueDraft(REQUIREMENTS, draft, tracer);

    if (critique.isComplete) {
      console.log('   El revisor no encuentra faltantes.'.green);
      break;
    }

    console.log('   Faltantes detectados: '.yellow);
    critique.missing.forEach((item) =>
      console.log(`       - ${JSON.stringify(item)}`)
    );

    // Reescribir en caso de problemas encontrados
    const revised = await revise(
      draft,
      critique.missing,
      VILLAIN_DOSSIER,
      tracer
    );

    draft = revised;
  }

  console.log(`\n Versión final (tras ${iteration} iteraciones): `.blue);
  console.log(draft.green);
  console.log('\n Auditoría: '.blue);
  const score = printAudit(auditBriefing(draft));

  return { ...tracer.summary(), score, iterations: iteration }; // score e iteraciones
}

// ---------------------------------------------------------------------------
// EJECUCIÓN DEL PROGRAMA
// ---------------------------------------------------------------------------

export async function reflectionMain() {
  const a = await withoutReflection();
  const b = await naiveReflection();
  const c = await reflectionWithRubric();

  console.log('\n═══ COMPARATIVA ═══\n'.blue);
  console.table({
    'Sin reflexión': a,
    'Reflexión ingenua': b,
    'Reflexión con rúbrica': c,
  });

  console.log(
    '\n  La reflexión ingenua cuesta tokens extra y casi no mejora nada:\n' +
      '  el modelo se aprueba a sí mismo.\n\n' +
      '  Reflexionar no sirve por reflexionar. Sirve cuando hay criterios\n' +
      '  concretos contra los que comparar.\n\n' +
      '  Y aun así, el revisor sigue siendo el mismo modelo que escribió.\n' +
      '  Separar los roles en dos agentes es el patrón Evaluator-Optimizer.\n'
  );
}
