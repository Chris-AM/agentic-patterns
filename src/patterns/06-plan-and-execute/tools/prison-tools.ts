import { tool } from 'ai';
import { z } from 'zod';

import { getCellStatus, getGuardLog } from '../data/prison.js';

// ---------------------------------------------------------------------------
// LAS HERRAMIENTAS
// ---------------------------------------------------------------------------

export const prisonTool = {
  getCellStatus: tool({
    description:
      'Consulta el estado de la celda de un villano (bloque, integridad, última inspección).',
    inputSchema: z.object({ villain: z.string() }),
    execute: async ({ villain }) => getCellStatus(villain),
  }),
  getGuardLog: tool({
    description:
      'Consulta la bitácora de guardias de un villano (entradas e incidentes).',
    inputSchema: z.object({ villain: z.string() }),
    execute: async ({ villain }) => getGuardLog(villain),
  }),
};
