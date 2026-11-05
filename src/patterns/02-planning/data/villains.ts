// ---------------------------------------------------------------------------
// LOS DATOS — villanos
// ---------------------------------------------------------------------------

export type Villain = {
  alias: string;
  power: string;
  /** Única especialidad capaz de neutralizarlo. */
  counteredBy: string;
  /** 1 = máxima prioridad. */
  threat: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /**
   * Puede liberar a los demás. NO se muestra en el texto del escenario:
   * el modelo debe deducirlo a partir del poder descrito.
   */
  freesOthers: boolean;
};

export const VILLAINS: Villain[] = [
  {
    alias: 'Mister Freeze',
    power: 'congela todo a su alrededor',
    counteredBy: 'fuego',
    threat: 1,
    freesOthers: false,
  },
  {
    alias: 'Killgrave',
    power: 'controla mentes con la voz',
    counteredBy: 'tecnología',
    threat: 2,
    freesOthers: false,
  },
  {
    alias: 'The Shade',
    power: 'se vuelve intangible en las sombras',
    counteredBy: 'luz',
    threat: 7,
    freesOthers: false,
  },
  {
    alias: 'Mirror Master',
    power: 'viaja por la dimensión espejo y puede sacar a otros de sus celdas',
    counteredBy: 'tecnología',
    threat: 3,
    freesOthers: true,
  },
  {
    alias: 'Solomon Grundy',
    power: 'regenera su cuerpo sin importar el daño recibido',
    counteredBy: 'luz',
    threat: 6,
    freesOthers: false,
  },
  {
    alias: 'Doctor Light',
    power: 'absorbe y redirige cualquier fuente de energía luminosa',
    counteredBy: 'luz',
    threat: 4,
    freesOthers: false,
  },
  {
    alias: 'Juggernaut',
    power: 'fuerza imparable, nada detiene su avance',
    counteredBy: 'telequinesis',
    threat: 5,
    freesOthers: false,
  },
];
