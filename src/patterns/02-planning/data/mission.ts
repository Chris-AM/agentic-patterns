import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';

// ---------------------------------------------------------------------------
// EL ESCENARIO — los datos como texto para el modelo
// ---------------------------------------------------------------------------

const SCENARIO_AS_TEXT = [
  'VILLANOS SUELTOS:',
  ...VILLAINS.map(
    (villain) =>
      `  ${villain.alias} | poder: ${villain.power} | ` +
      `solo lo detiene: ${villain.counteredBy} | amenaza: ${villain.threat}/7`
  ),
  '',
  'HÉROES DISPONIBLES:',
  ...HEROES.map(
    (hero) =>
      `  ${hero.alias} | especialidad: ${hero.specialty} | ` +
      `horas disponibles: ${hero.availableHours}`
  ),
].join('\n');

/**
 * VILLANOS SUELTOS:
 *   Mister Freeze | poder: congela todo a su alrededor | solo lo detiene: fuego | amenaza: 1/7
 *   Killgrave | poder: controla mentes con la voz | solo lo detiene: tecnología | amenaza: 2/7
 *   The Shade | poder: se vuelve intangible en las sombras | solo lo detiene: luz | amenaza: 7/7
 *   Mirror Master | poder: viaja por la dimensión espejo y puede sacar a otros de sus celdas | solo lo detiene: tecnología | amenaza: 3/7
 *   Solomon Grundy | poder: regenera su cuerpo sin importar el daño recibido | solo lo detiene: luz | amenaza: 6/7
 *   Doctor Light | poder: absorbe y redirige cualquier fuente de energía luminosa | solo lo detiene: luz | amenaza: 4/7
 *   Juggernaut | poder: fuerza imparable, nada detiene su avance | solo lo detiene: telequinesis | amenaza: 5/7
 *
 * HÉROES DISPONIBLES:
 *   Antorcha Humana | especialidad: fuego | horas disponibles: 6
 *   Green Lantern | especialidad: luz | horas disponibles: 4
 *   Iron Man | especialidad: tecnología | horas disponibles: 5
 *   Jean Grey | especialidad: telequinesis | horas disponibles: 3
 */

// ---------------------------------------------------------------------------
// EL PROBLEMA
// ---------------------------------------------------------------------------

/**
 * El enunciado cruza cuatro restricciones:
 *   1. Cada villano solo cae ante una especialidad concreta.
 *   2. Cada héroe tiene un límite de horas.
 *   3. Cada operación consume 2 horas del héroe asignado.
 *   4. Mirror Master DEBE ir primero, o el resto se vuelve a escapar.
 *
 * Resolver esto "de un tirón" casi siempre rompe alguna.
 */
export const MISSION =
  'Se han fugado 7 villanos de la prisión de máxima seguridad. ' +
  'Diseña el operativo para recapturarlos a todos.\n\n' +
  'REGLAS:\n' +
  '  - Cada operación consume 2 horas del héroe asignado.\n' +
  '  - Los héroes pueden operar en paralelo; las horas son presupuesto individual.\n' +
  '  - Un héroe solo puede neutralizar villanos de su especialidad.\n' +
  '  - Ningún héroe puede exceder sus horas disponibles.\n' +
  '  - Atiende a los villanos por prioridad, donde 1 es el más urgente.\n' +
  '  - Si algún villano puede liberar a los demás, debe caer antes que nadie.\n' +
  '  - Si el operativo no es viable con los recursos disponibles, dilo.\n\n' +
  SCENARIO_AS_TEXT;
