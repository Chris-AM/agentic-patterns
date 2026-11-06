// ---------------------------------------------------------------------------
// LA TAREA
// ---------------------------------------------------------------------------

export const VILLAIN_DOSSIER = [
  'EXPEDIENTE: Mirror Master',
  '  Nombre real: Evan McCulloch',
  '  Poder: viaja por la dimensión espejo; puede extraer a otros de sus celdas',
  '  Debilidad: los espejos requieren superficie reflectante intacta',
  '  Última ubicación: distrito industrial, almacén 7',
  '  Cómplices conocidos: Killgrave',
  '  Recompensa: 250.000 USD',
].join('\n');

/**
 * Seis requisitos, todos verificables sin criterio subjetivo.
 * Que sean comprobables por código es lo que hace honesto al lab:
 * no dependemos de que el modelo diga si mejoró.
 */
export const REQUIREMENTS = [
  'Menciona el nombre real del villano',
  'Indica una contramedida concreta basada en su debilidad',
  'Especifica la última ubicación conocida',
  'Nombra a sus cómplices',
  'Incluye el monto exacto de la recompensa',
  'Termina con una nueva línea que empiece por "RIESGO:" (sin negritas, sin viñetas, sin markdown, sin espacios adelante de la palabra "RIESGO:")  ',
];

export const TASK =
  'Redacta un briefing operativo para el equipo de captura, de máximo ' +
  '120 palabras.\n\n' +
  'REQUISITOS OBLIGATORIOS:\n' +
  REQUIREMENTS.map((requirement, i) => `  ${i + 1}. ${requirement}`).join(
    '\n'
  ) +
  '\n\n' +
  VILLAIN_DOSSIER;
