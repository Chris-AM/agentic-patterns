export const HOURS_PER_OPERATION = 2;

/**
 * Capacidad total: 11 operaciones para 12 villanos.
 * Está diseñado así a propósito: SIEMPRE sobra al menos un villano.
 * El plan está obligado a contemplar la rama "nadie puede con este villano".
 */
export const MISSION =
  'Se han fugado 12 villanos de la prisión de máxima seguridad.\n\n' +
  'Elabora el operativo:\n' +
  '  - Agrupa los villanos por el héroe que los va a neutralizar.\n' +
  '  - Un héroe puede neutralizar a un villano si la especialidad que ' +
  'contrarresta al villano aparece entre las del héroe ' +
  '(un héroe puede tener varias, separadas por "|").\n' +
  `  - Cada operación consume ${HOURS_PER_OPERATION} horas del héroe.\n` +
  '  - Ningún héroe puede exceder sus horas disponibles.\n' +
  '  - Atiende primero a los de menor número de amenaza (1 = más urgente).\n' +
  '  - Dentro de cada grupo, ordena los villanos por amenaza ascendente.\n' +
  '  - Los villanos que nadie pueda cubrir van a una lista aparte.';
