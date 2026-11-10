// Tarea predecible: se sabe de antemano qué hay que consultar.
export const PREDICTABLE_TASK =
  'Genera un informe de estado de Mister Freeze, Killgrave, Mirror Master ' +
  // ', The Shocker ' + // este villano no ha sido capturado
  'y Juggernaut. Para cada uno necesito: bloque y celda, integridad de la ' +
  'celda, y cuántos incidentes tiene en la bitácora.';

// ---------------------------------------------------------------------------
// C) CUANDO SE ROMPE — la tarea depende de un resultado intermedio
// ---------------------------------------------------------------------------

/**
 * Aquí el segundo paso depende de lo que devuelva el primero:
 * no se puede saber QUÉ celdas revisar sin leer antes las bitácoras.
 * ReAct lo resuelve; Plan-and-Execute no puede, porque planifica a ciegas.
 */
export const ADAPTIVE_TASK =
  'Revisa la bitácora de Mister Freeze, Killgrave, Mirror Master y ' +
  'Juggernaut. SOLO para los villanos con 2 o más incidentes, consulta ' +
  'el estado de su celda e indica si la integridad es inferior a 50.';
