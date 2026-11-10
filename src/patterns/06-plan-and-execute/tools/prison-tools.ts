import { tool } from 'ai';
import { z } from 'zod';

import { registry, TOOL_NAMES } from './registry.js';

// ---------------------------------------------------------------------------
// LAS HERRAMIENTAS — derivadas del registro (las usa ReAct)
// ---------------------------------------------------------------------------

export const prisonTool = Object.fromEntries(
  TOOL_NAMES.map((name) => [
    name,
    tool({
      description: registry[name].description,
      inputSchema: z.object({ villain: z.string() }),
      execute: async ({ villain }) => registry[name].run(villain),
    }),
  ])
);
