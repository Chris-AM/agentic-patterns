// ---------------------------------------------------------------------------
// EL ENCARGO
// ---------------------------------------------------------------------------

export const MAX_CHARS = 280;
export const MIN_CHARS = MAX_CHARS - 40;

export const MAX_RETRIES = 4;

export const COURSE = {
  title: 'Patrones de diseño agéntico: Respuestas efectivas a desafíos',
  hours: 18,
  priceUSD: 34.99,
  url: 'https://cursos.devtalles.com/cursos/patrones-diseno-agentico',
};

export const BRIEF =
  `Escribe el anuncio de lanzamiento de un curso para publicarlo en X.\n\n` +
  `CURSO: ${COURSE.title}\n` +
  `DURACIÓN: ${COURSE.hours} horas\n` +
  `PRECIO: ${COURSE.priceUSD} USD\n` +
  `ENLACE: ${COURSE.url}\n\n` +
  `REQUISITOS:\n` +
  `  - Máximo ${MAX_CHARS} caracteres, contando espacios y el enlace.\n` +
  // `  - Trata de usar todo el espacio disponible.\n` +
  `  - Usar al menos ${MIN_CHARS} caracteres.\n` +
  `  - Incluye el título exacto, el precio y el enlace.\n` +
  `  - Tono directo, para desarrolladores. Sin markdown.\n` +
  `  - No emojis.\n` +
  `  - No sobre vendas, se honesto con lo que ofreces.\n` +
  `  - Devuelve ÚNICAMENTE el anuncio, sin comillas ni explicaciones.`;

export const WRITER_INSTRUCTIONS =
  'Escribes anuncios cortos para redes sociales. Responde en español. ' +
  'Devuelves solo el texto del anuncio, sin comillas, sin markdown, ' +
  'sin explicar lo que hiciste.';
