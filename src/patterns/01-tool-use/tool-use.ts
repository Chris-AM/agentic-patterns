/**
 * PATRÓN: Uso de herramientas - Tool use
 * ---------------------------
 * El catálogo de cursos NO está en el entrenamiento
 * del modelo. Sin herramientas, el modelo inventa precios y cursos con
 * total confianza o en su defecto, no hace nada.
 * Con herramientas, consulta el dato real.
 */

import { generateText, stepCountIs } from 'ai';
import { createTracer, model } from '../../helpers/index.js';
import { findCourses } from './tools/course-tool.js';

const QUESTION =
  '¿Cuánto costarían juntos el curso de TypeScript y el de Docker ' +
  'con un 20% de descuento? Dame también las horas totales.';

async function withoutTools() {
  const tracer = createTracer('sin-herramientas');

  const { text } = await generateText({
    model,
    prompt: QUESTION,
    onStepEnd: tracer.onStepFinish,
  });

  console.log('\n Respuesta: ', text.green);
  console.log('\n ⚠️ Verificar los números contra el catalogo de cursos');

  return tracer.summary();
}

//! ======== Implementar el Patrón TOOL USE

async function withTools() {
  const tracer = createTracer('con-herramientas');

  const { text } = await generateText({
    model,
    prompt: QUESTION,
    tools: {
      findCourses,
    },
    // Circuit Breaker
    stopWhen: stepCountIs(6),
    instructions:
      'Eres un asistente del catálogo de cursos de detalles. ' +
      ' No inventes precios, duraciones ni nombres de cursos. ' +
      ' Consúltalos siempre con las herramientas disponibles. ',
    onStepEnd: tracer.onStepFinish,
  });

  console.log('\n Respuesta: ', text.green);
  console.log('\n ⚠️ Verificar los números contra el catalogo de cursos');

  return tracer.summary();
}

export async function toolUseMain() {
  const resultA = await withoutTools();
  const resultB = await withTools();

console.log('\n==== Comparativa ====');
  console.table({
    'Sin herramientas': resultA,
    'Con herramientas': resultB,
  });
}