/**
 * PATRÓN: ReAct (Reasoning + Acting)
 * ---------------------------------------------------
 * Bucle que intercala razonamiento y acción:
 *   pensar → actuar → observar → pensar → ...
 *
 * El escenario esencial, puede ser más complejo: UNA herramienta y una cadena
 * de longitud desconocida.
 *
 * Un gasto necesita aprobación. Se sube por la jerarquía hasta encontrar
 * a alguien con límite suficiente. Nadie sabe cuántos escalones hay que
 * subir hasta subirlos: el jefe de cada persona solo aparece DENTRO de
 * su propia ficha.
 *
 * Por eso no se puede planificar por adelantado. No es que el plan fijo
 * se equivoque: es que no se puede ni escribir.
 */

//! Investigar: ¿por qué ReAct funciona mejor con
//! modelos de razonamiento que con modelos sin razonamiento?
import { generateText, stepCountIs } from 'ai';
import { createTracer, model } from '../../helpers/index.js';
import { REQUEST } from './data/approval-request.js';
import { EMPLOYEES } from './data/employees.js';
import { getEmployee } from './tools/get-employee.js';
import de from 'zod/v4/locales/de.js'

// ---------------------------------------------------------------------------
// A) SIN ReAct — una sola consulta, hecha por nosotros
// ---------------------------------------------------------------------------
// Le damos la ficha de Ana ya resuelta y le pedimos la respuesta.
// El modelo ve que su jefe es EMP-2, pero no puede consultarlo.
// Sin bucle, la cadena se corta en el primer eslabón.

// async function withoutReAct() {
//   console.log('\n═══ A) SIN ReAct — una sola pasada ═══\n'.blue);
//   const tracer = createTracer('sin-react');

//   const anaRecord = EMPLOYEES.find((e) => e.id === 'EMP-1')!;

//   const { text } = await generateText({
//     model,
//     //? El docente agrega el tool getEmployee para darle al agente 
//     //? el poder de consultar el empleado con el id 2
//     //?  (en este caso en específico).
//     tools: { getEmployee },
//     instructions:
//       'Eres un asistente de finanzas. Responde con los datos disponibles. ' +
//       'Responde en español. ' +
//       'Si no puedes encontrar el aprobador, responde con "No se puede aprobar el gasto".',
//     prompt:
//       `${REQUEST}\n\n` +
//       `DATO DISPONIBLE: ${JSON.stringify(anaRecord, null, 2)}`,
//     onStepEnd: tracer.onStepFinish,
//   });

//   console.log('\n Respuesta:\n'.blue, text.green);

//   console.log(
//     (
//       '\n  ⚠️  Solo conoce a Ana y el ID de su jefe. Sin poder consultarlo,' +
//       '\n      o inventa un aprobador o se detiene en EMP-2.'
//     ).yellow
//   );

//   return tracer.summary();
// }

// ---------------------------------------------------------------------------
// B) CON ReAct — el bucle sube solo
// ---------------------------------------------------------------------------

async function withReAct() {
  console.log('\n═══ B) CON ReAct — bucle adaptativo ═══\n'.blue);
  const tracer = createTracer('con-reAct');

  const anaRecord = EMPLOYEES.find((e) => e.id === 'EMP-1')!;

  const { text } = await generateText({
    model,
    tools: { getEmployee },
    // Circuit breaker.
    //? comentario del docente: el circuit breaker debe tener sentido
    //? para el problema que se está resolviendo.
    stopWhen: stepCountIs(10),
    instructions:
      'Eres un asistente de finanzas. Trabaja en ciclos: consulta una ' +
      'ficha, compara el límite con el importe y decide si necesitas ' +
      'subir un nivel más.\n' +
      'CONDICIÓN DE CIERRE: solo has terminado cuando encuentres a alguien ' +
      'cuyo límite CUBRA el importe. Si no lo cubre, sube al jefe.\n' +
      'Si llegas a alguien sin jefe (managerId null) y aún no alcanza, ' +
      'detente y di que el gasto no es aprobable internamente.\n' +
      'No inventes IDs: sácalos del campo managerId del resultado anterior.\n' +
      'Tu último mensaje debe ser la respuesta final, no un razonamiento ' +
      'suelto. Cita el nombre, el cargo y el límite. Responde en español.',
    prompt:
      `${REQUEST}\n\n` +
      `DATO DISPONIBLE: ${JSON.stringify(anaRecord, null, 2)}`,
    onStepEnd: tracer.onStepFinish,
  });

  console.log('\nRespuesta: \n'.blue, text.green);

  console.log(
    (
      '\n  ✅ Cuenta las consultas: Ese número es un DATO del' +
      '\n     organigrama, no del enunciado. Por eso no se podía planificar.'
    ).yellow
  );

  return tracer.summary();
}

// ---------------------------------------------------------------------------
// EJECUCIÓN DEL PROGRAMA
// ---------------------------------------------------------------------------

export async function reActSimpleMain() {
  // const a = await withoutReAct();
  const b = await withReAct();

  console.log('\n═══ COMPARATIVA ═══\n'.blue);
  console.table({
    // 'Sin ReAct': a,
    'Con ReAct': b,
  });

  console.log(
    '\n  La cadena tiene varios eslabones, pero eso solo se sabe al\n' +
      '  recorrerla. Un plan trazado por adelantado tendría que adivinar\n' +
      '  cuántas veces subir.\n\n' +
      '  ReAct compra exactamente eso: decidir la siguiente acción DESPUÉS\n' +
      '  de observar la anterior. Se paga en llamadas y en latencia.\n\n' +
      '  Y el precio de adaptarse es no saber cuándo parar.\n'
  );
}
