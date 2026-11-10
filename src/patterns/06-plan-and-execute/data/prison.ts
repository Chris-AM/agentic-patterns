// ---------------------------------------------------------------------------
// LOS DATOS — la prisión de máxima seguridad tras la recaptura
// ---------------------------------------------------------------------------

export type CellStatus = {
  villain: string;
  block: string;
  cell: number;
  integrity: number; // 0-100
  lastInspection: string;
};

export type GuardLog = {
  villain: string;
  entries: string[];
  incidents: number;
};

export const CELLS: Record<string, CellStatus> = {
  mister_freeze: {
    villain: 'Mister Freeze',
    block: 'C',
    cell: 12,
    integrity: 97,
    lastInspection: '2026-08-20',
  },
  killgrave: {
    villain: 'Killgrave',
    block: 'A',
    cell: 3,
    integrity: 88,
    lastInspection: '2026-08-21',
  },
  mirror_master: {
    villain: 'Mirror Master',
    block: 'D',
    cell: 1,
    integrity: 41,
    lastInspection: '2026-08-15',
  },
  juggernaut: {
    villain: 'Juggernaut',
    block: 'B',
    cell: 7,
    integrity: 73,
    lastInspection: '2026-08-19',
  },
};

export const LOGS: Record<string, GuardLog> = {
  'mister freeze': {
    villain: 'Mister Freeze',
    entries: ['Sin novedad', 'Sin novedad'],
    incidents: 0,
  },
  killgrave: {
    villain: 'Killgrave',
    entries: ['Intentó hablar con un guardia; protocolo de silencio aplicado'],
    incidents: 1,
  },
  'mirror master': {
    villain: 'Mirror Master',
    entries: [
      'Superficie de la puerta pulida por el interno',
      'Reflejo detectado en el suelo de la celda',
    ],
    incidents: 2,
  },
  juggernaut: {
    villain: 'Juggernaut',
    entries: ['Sin novedad'],
    incidents: 0,
  },
};

// Capa de datos: funciones planas, compartidas por las herramientas (Tools)
// y por el ejecutor del plan (igual que en el patrón 04).
export function getCellStatus(villain: string): CellStatus | { error: string } {
  const cellId = villain.toLowerCase().replaceAll(' ', '_');

  return (
    CELLS[cellId] ?? {
      error: `Sin celda registrada: ${villain}`,
    }
  );
}

export function getGuardLog(villain: string): GuardLog | { error: string } {
  return (
    LOGS[villain.toLowerCase()] ?? {
      error: `Sin bitácora registrada: ${villain}`,
    }
  );
}
