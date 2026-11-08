/**
 * PATRÓN: ReAct (Reasoning + Acting) — con API real
 * --------------------------------------------------
 *
 * Clima en Ottawa, la capital de Canadá
 *
 * Bucle que intercala razonamiento y acción:
 *   pensar → actuar → OBSERVAR → corregir la acción → actuar de nuevo
 *
 * Aquí la primera acción del agente devuelve un resultado VÁLIDO pero
 * EQUIVOCADO. No falla, no da error: responde con seguridad sobre otra
 * ciudad. El agente tiene que darse cuenta al observar el resultado y
 * reformular la llamada.
 *
 * Y no es un truco inventado: existen al menos ocho ciudades llamadas
 * "Ottawa" en el mundo (Ontario, Illinois, Kansas, Ohio, Virginia
 * Occidental, Costa de Marfil, Sudáfrica e Indonesia). Pedir el clima
 * de "Ottawa" a secas es genuinamente ambiguo.
 *
 * LO IMPORTANTE: el dato correcto NO está al alcance de la primera
 * acción. geocodeCity no acepta país: no hay forma de "pedirlo bien" a
 * la primera. Solo se llega a Ontario ejecutando una acción DISTINTA,
 * y solo se sabe que hace falta si se OBSERVA el aviso del resultado.
 * Reintentar idéntico sería el anti-patrón.
 *
 *   A) Sin ReAct → una pasada: se cree el primer resultado
 *   B) Con ReAct → observa la discrepancia y reformula
 *
 * El clima sale de Open-Meteo, una API pública real y sin API key.
 */

import { generateText, stepCountIs } from 'ai';

import { createTracer, model } from '../../helpers/index.js';
import { QUESTION } from './data/weather-question.js';
import { geocodeCity } from './tools/geocode-city.js';
import { getWeather } from './tools/get-weather.js';
import { listCityMatches } from './tools/list-city-matches.js';

const TOOLS = { geocodeCity, listCityMatches, getWeather };

// ---------------------------------------------------------------------------
// A) SIN ReAct — se cree el primer resultado
// ---------------------------------------------------------------------------
// Sin ciclo de observación, el agente encadena geocode → weather y
// responde. El resultado es coherente, está bien redactado, y habla de
// una ciudad de Illinois con 18.000 habitantes.

async function withoutReAct() {
  console.log('\n═══ A) SIN ReAct — una sola pasada ═══\n'.blue);
  const tracer = createTracer('sin-react');

  const { text } = await generateText({
    model,
    prompt: QUESTION,
    tools: TOOLS,
    stopWhen: stepCountIs(4), // circuit breaker: geocode → weather = 2 acciones.
    instructions:
      'Eres un asistente meteorológico. Usa las herramientas para ' +
      'obtener el dato y responde de inmediato con lo que devuelvan. ' +
      'No cuestiones los resultados. Responde en español.',
    onStepEnd: tracer.onStepFinish,
  });

  console.log('\n Respuesta:\n'.blue, text.green);

  console.log(
    (
      '\n  ⚠️  La respuesta es fluida y probablemente falsa. Fíjate en el' +
      '\n      campo "warning" del primer resultado: la herramienta AVISÓ' +
      '\n      de la ambigüedad y nadie lo leyó.'
    ).yellow
  );

  return tracer.summary();
}

// ---------------------------------------------------------------------------
// B) CON ReAct — observar, detectar la discrepancia, reformular
// ---------------------------------------------------------------------------

async function withReAct() {
  console.log('\n═══ B) CON ReAct — bucle adaptativo ═══\n'.blue);
  const tracer = createTracer('con-react');

  const { text } = await generateText({
    model,
    prompt: QUESTION,
    tools: TOOLS,
    // Circuit breaker: geocode → listCityMatches → weather = 3 acciones.
    stopWhen: stepCountIs(8),
    // TODO: llena las instrucciones
    instructions:
      'Eres un asistente meteorológico. Trabaja en ciclos: ejecuta una ' +
      'acción, OBSERVA el resultado y comprueba que responde a lo que se ' +
      'pidió antes de continuar.\n' +
      'VERIFICACIÓN OBLIGATORIA: tras geocodificar, comprueba que la ' +
      'región y el país coinciden con lo que pidió el usuario, y LEE el ' +
      'campo "warning" del resultado. Si avisa de varias coincidencias, ' +
      'NO des por buena la que te dieron: usa listCityMatches y elige la ' +
      'correcta por país. Repetir la misma llamada no sirve de nada.\n' +
      //! Esta es la instrucción que considero importante para obtener el resultado correcto.
      'No recomiendes otra ciudad, usa la que es más probable que sea la correcta.' +
      'Si hay ambigüedad, no hace falta que recomiendes más cosas, simplemente que encontraste otras ciudades, pero siempre regresa el clima de la ciudad que es más probable que sea. ' +
      'Solo consulta el clima cuando las coordenadas sean las correctas.\n' +
      'En la respuesta final, menciona brevemente si hubo que desambiguar.\n' +
      'Tu último mensaje debe ser la respuesta al usuario, no un ' +
      'razonamiento suelto. Responde en español.',
    onStepEnd: tracer.onStepFinish,
  });

  console.log('\n Respuesta:\n'.blue, text.green);

  console.log(
    (
      '\n  ✅ Mira la traza: la acción correctiva es OTRA herramienta,' +
      '\n     no la misma repetida. El dato correcto no estaba al alcance' +
      '\n     del primer intento: había que ir a buscarlo.'
    ).yellow
  );

  return tracer.summary();
}

// ---------------------------------------------------------------------------
// EJECUCIÓN DEL PROGRAMA
// ---------------------------------------------------------------------------

export async function reActWeatherMain() {
  const a = await withoutReAct();
  const b = await withReAct();

  console.log('\n═══ COMPARATIVA ═══\n'.blue);
  console.table({
    'Sin ReAct': a,
    'Con ReAct': b,
  });

  console.log(
    '\n  Ninguna herramienta falló. Ninguna devolvió un error. La primera\n' +
      '  respuesta era técnicamente correcta: hay una Ottawa en Illinois.\n\n' +
      '  Lo que falta sin ReAct no es capacidad de recuperarse de errores,\n' +
      '  es el paso de OBSERVAR: comparar lo que volvió con lo que se pidió.\n\n' +
      '  Y observar solo sirve si puedes cambiar la siguiente acción. Por eso\n' +
      '  el bucle importa: sin él, la observación no tiene dónde aterrizar.\n'
  );
}
