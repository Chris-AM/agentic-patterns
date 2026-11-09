/**
 * PATRÓN: Encadenamiento de prompts
 * --------------------------------------------------
 * Dos eslabones y un bucle. Nada más.
 *
 *   Eslabón 1 (modelo) → escribe el anuncio borrador
 *   Gate      (código) → ¿cabe en 280 caracteres?
 *   Eslabón 2 (modelo) → recorta, sabiendo cuánto le sobra
 *
 *
 * Por qué este ejemplo: el modelo NO SABE contar caracteres.
 * No es un problema de prompt. Es que ve tokens, no letras. Puedes
 * escribirle "MÁXIMO 280 CARACTERES" en mayúsculas
 * y puede devolver 340 con total confianza como 100 caracteres más.
 *
 * Y `text.length` nunca se equivoca.
 *
 * Esa asimetría es el patrón entero: el modelo es incapaz de verificar
 * algo que una línea de código verifica siempre. La cadena no MEJORA el
 * resultado, lo GARANTIZA.
 *
 *   A) Sin cadena  → una llamada y a rezar (esperar lo mejor)
 *   B) Con cadena  → gate + reintentos + fallback determinista
 *   C) Riesgo      → el mismo bucle, pero sin tope de reintentos (peligroso, puede no terminar)
 */

import { createTracer } from '../../helpers/index.js';
import { auditAnnouncement } from './data/announcement-checks.js';
import { MAX_CHARS, MAX_RETRIES } from './data/announcement.js';
import { lengthGate } from './gates/length-gate.js';
import { failedChecks, printAudit } from './judges/audit.js';
import { updateAnnouncement } from './chains/update-announcement.js';
import { writeAnnouncement } from './chains/write-announcement.js';

// ---------------------------------------------------------------------------
// A) SIN CADENA — una llamada y a rezar
// ---------------------------------------------------------------------------

// async function withoutChaining() {
//   console.log('\n═══ A) SIN CADENA ═══\n'.blue);
//   const tracer = createTracer('sin-cadena');

//   const announcement = await writeAnnouncement(tracer);
//   console.log(announcement.green);
//   console.log(`\nLongitud real: ${announcement.length} caracteres`);

//   console.log(`\nAuditoría: `.blue);
//   const score = printAudit(auditAnnouncement(announcement));

//   console.log(
//     `\n     ⚠️ El requisito estaba en el prompt.
//       El modelo no puede cumplirlo de forma fiable porque no cuenta caracteres
//       procesa tokens. Aquí no hay prompt que valga.`.yellow
//   );

//   return { ...tracer.summary(), score, retries: 0 }; // score
// }

// ---------------------------------------------------------------------------
// B) CON CADENA — gate, reintentos acotados y fallback determinista
// ---------------------------------------------------------------------------

async function withChaining() {
  console.log('\n═══ B) CON CADENA ═══\n'.blue);
  const tracer = createTracer('con-cadena');

  let announcement = await writeAnnouncement(tracer);
  let retries = 0;

  console.log(`Borrador: ${announcement.length} caracteres.`.purple);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const feedback = lengthGate(announcement);

    if (!feedback) {
      console.log(` ✅ Gate superado en el intento ${attempt}`);
      break;
    }

    console.log(`🔴 ${feedback}`.yellow);

    announcement = await updateAnnouncement(announcement, feedback, tracer);
    retries++;
    console.log(` Intento ${attempt}: ${announcement.length} caracteres`);
  }

  // Fallback determinista
  if (lengthGate(announcement)) {
    if (announcement.length > MAX_CHARS) {
      announcement = `${announcement.slice(0, MAX_CHARS - 3)}...`;
    }
  }

  console.log(`\n${announcement.green}`);
  console.log(`\n   Longitud final: ${announcement.length} caracteres`);

  console.log('\n Auditoría:'.blue);
  const score = printAudit(auditAnnouncement(announcement));

  return { ...tracer.summary(), retries, score }; // score, retries
}


// ---------------------------------------------------------------------------
// C) RIESGO — el mismo bucle, sin tope de reintentos
// ---------------------------------------------------------------------------

/** Tope de seguridad para el laboratorio. En el bucle "sin tope" real, no lo habría. */
const SAFETY_LIMIT = 10;

async function chainWithoutRetryLimit() {
  console.log('\n═══ C) RIESGO: BUCLE SIN TOPE ═══\n'.blue);
  const tracer = createTracer('sin-tope');

  let announcement = await writeAnnouncement(tracer);
  let retries = 0;
  const history: number[] = [];

  let pendingChecks = failedChecks(auditAnnouncement(announcement));

  while (pendingChecks.length > 0 && retries < SAFETY_LIMIT) {
    const feedback = pendingChecks.map((check) => check.label).join('\n');
    history.push(pendingChecks.length);

    console.log({ feedback: `Problemas: \n ${feedback}`.purple });

    announcement = await updateAnnouncement(announcement, feedback, tracer);

    retries++;
    console.log(` Intento: ${retries} \n ${announcement} ---`);
    pendingChecks = failedChecks(auditAnnouncement(announcement));
  }

  console.log(`\n  Trayectoria: ${history.join(' -> ').yellow} `);
  console.log(` Auditoria`.blue);
  const score = printAudit(auditAnnouncement(announcement));
  console.log(`Anuncio final\n`.blue, announcement.green);

  console.log(
    `\n\n
  ⚠️  Mira la trayectoria. El modelo se acerca a la solución y se queda
      rondando: 4 → 3 → 2 → 1 → 1 → 1 → 2 → 1... 
      Cada iteración cuesta tokens.
      Sin tope, esto puede no terminar.
      Todo bucle necesita un techo Y una salida determinista.`.yellow
  );

  return { ...tracer.summary(), score, retries };
}

// ---------------------------------------------------------------------------
// EJECUCIÓN DEL PROGRAMA
// ---------------------------------------------------------------------------

export async function promptChainingMain() {
  // const a = await withoutChaining();
  // const b = await withChaining();
  const c = await chainWithoutRetryLimit();

  console.log('\n═══ COMPARATIVA ═══\n'.blue);
  console.table({
    // 'Sin cadena': a,
    // 'Con cadena': b,
    'Bucle sin tope': c,
  });

  console.log(
    '\n  El gate son unas pocas líneas de TypeScript y decide algo que el\n' +
      '  modelo no puede decidir. Esa es toda la idea del patrón.\n\n' +
      '  La cadena no mejora el anuncio: garantiza que cabe y es correcto.\n' +
      '  "Mejor a veces" y "correcto siempre" no son lo mismo.\n\n' +
      '  Y el eslabón que cierra el caso no es un prompt: es el slice.\n'
  );
}
