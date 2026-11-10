import { getCellStatus, getGuardLog } from '../data/prison.js';

// ---------------------------------------------------------------------------
// REGISTRO ÚNICO DE HERRAMIENTAS — única fuente de verdad
// ---------------------------------------------------------------------------
// El plan (enum + instrucciones), el ejecutor y las tools de ReAct se
// derivan de aquí. Agregar una herramienta = agregarla solo en este objeto.

export const registry = {
  getCellStatus: {
    description:
      'Consulta el estado de la celda de un villano (bloque, integridad, última inspección).',
    run: getCellStatus,
  },
  getGuardLog: {
    description:
      'Consulta la bitácora de guardias de un villano (entradas e incidentes).',
    run: getGuardLog,
  },
};

export type ToolName = keyof typeof registry;

export const TOOL_NAMES = Object.keys(registry) as [ToolName, ...ToolName[]];
