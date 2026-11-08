// ---------------------------------------------------------------------------
// LOS DATOS — el organigrama
// ---------------------------------------------------------------------------

export type Employee = {
  id: string;
  name: string;
  role: string;
  /** Máximo que puede aprobar por sí solo, en USD. */
  approvalLimitUSD: number;
  /** Su jefe directo. null = cima del organigrama. */
  managerId: string | null;
};

export const EMPLOYEES: Employee[] = [
  {
    id: 'EMP-1',
    name: 'Ana Ruiz',
    role: 'desarrolladora',
    approvalLimitUSD: 0,
    managerId: 'EMP-2',
  },
  {
    id: 'EMP-2',
    name: 'Luis Prado',
    role: 'líder de equipo',
    approvalLimitUSD: 1_000,
    managerId: 'EMP-3',
  },
  {
    id: 'EMP-3',
    name: 'Carmen Vidal',
    role: 'directora de área',
    approvalLimitUSD: 5_000,
    managerId: 'EMP-4',
  },
  {
    id: 'EMP-4',
    name: 'Óscar Peña',
    role: 'director financiero',
    approvalLimitUSD: 50_000,
    managerId: 'EMP-5',
  },
  {
    id: 'EMP-5',
    name: 'Pedro García',
    role: 'director de finanzas',
    approvalLimitUSD: 100_000,
    managerId: 'EMP-6',
  },
  {
    id: 'EMP-6',
    name: 'María López',
    role: 'CEO',
    approvalLimitUSD: 1_000_000,
    managerId: 'EMP-7',
  },
  {
    id: 'EMP-7',
    name: 'Juan Peña',
    role: 'CEO - Founder',
    approvalLimitUSD: 2_000_000,
    managerId: null,
  },
];
