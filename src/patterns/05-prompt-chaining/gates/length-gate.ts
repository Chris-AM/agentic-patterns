import { MAX_CHARS, MIN_CHARS, COURSE } from '../data/announcement.js';

// ---------------------------------------------------------------------------
// EL GATE — Líneas que el modelo no puede replicar
// ---------------------------------------------------------------------------

/**
 * Fíjate en lo que devuelve: no un "hazlo más corto", "hazlo más largo",
 * sino el excedente o el faltante exacto.
 * EXACTO. Un buen gate no dice solo que no. Dice cuánto.
 */
export function lengthGate(text: string): string | undefined {
  if (text.length > MAX_CHARS) {
    return (
      `El anuncio tiene ${text.length} caracteres. Te sobran ` +
      `${text.length - MAX_CHARS}. Recórtalo a ${MAX_CHARS} o menos SIN ` +
      `eliminar el título exacto, el precio ni el enlace.`
    );
  }

  if (text.length < MIN_CHARS) {
    return (
      `El anuncio tiene ${text.length} caracteres y se queda corto: ` +
      `te faltan ${MIN_CHARS - text.length} para el mínimo de ${MIN_CHARS}. ` +
      `Amplíalo sin pasar de ${MAX_CHARS}: añade un beneficio concreto ` +
      `del curso o menciona las ${COURSE.hours} horas.`
    );
  }

  return undefined;
}
