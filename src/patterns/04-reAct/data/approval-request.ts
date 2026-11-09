// ---------------------------------------------------------------------------
// EL PROBLEMA
// ---------------------------------------------------------------------------

// export const AMOUNT_USD = 8_500;
export const AMOUNT_USD = 1_900_000;

export const REQUEST =
  `Ana Ruiz (EMP-1) necesita aprobación para un gasto de ` +
  `${AMOUNT_USD.toLocaleString('es')} USD.\n\n` +
  'Averigua QUIÉN debe aprobarlo: la primera persona de su cadena de ' +
  'mando cuyo límite cubra el importe.\n\n' +
  'Responde con el nombre, el cargo y su límite de aprobación.';

/**
 * La cadena real: Ana (0) → Luis (1.000) → Carmen (5.000) → Óscar (50.000).
 * Los tres primeros se quedan cortos. La respuesta es Óscar Peña.
 * Cuatro consultas, y ninguna se puede anticipar desde el enunciado.
 */
