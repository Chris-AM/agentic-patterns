// ---------------------------------------------------------------------------
// LOS DATOS — héroes
// ---------------------------------------------------------------------------

export type Hero = {
  alias: string;
  specialty: string;
  /** Horas que puede operar antes de quedar fuera de combate. */
  availableHours: number;
};

export const HEROES: Hero[] = [
  { alias: 'Antorcha Humana', specialty: 'fuego', availableHours: 6 },
  { alias: 'Green Lantern', specialty: 'luz', availableHours: 4 },
  { alias: 'Iron Man', specialty: 'tecnología', availableHours: 5 },
  { alias: 'Jean Grey', specialty: 'telequinesis', availableHours: 3 },
  // { alias: 'Superman', specialty: 'fuego|luz', availableHours: 2 },
];
