export type Hero = {
  alias: string;
  /** Puede contener varias especialidades separadas por "|". */
  specialty: string;
  /** Horas que puede operar. Cada operación consume 2. */
  availableHours: number;
};

export const HEROES: Hero[] = [
  { alias: 'Antorcha Humana', specialty: 'fuego', availableHours: 6 },
  { alias: 'Green Lantern', specialty: 'luz', availableHours: 4 },
  { alias: 'Iron Man', specialty: 'tecnología', availableHours: 6 },
  { alias: 'Jean Grey', specialty: 'telequinesis', availableHours: 4 },
  { alias: 'Superman', specialty: 'fuego|luz', availableHours: 2 },
];
