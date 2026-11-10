// ---------------------------------------------------------------------------
// LOS DATOS — la fuga masiva
// ---------------------------------------------------------------------------

export type Villain = {
  alias: string;
  /** Única especialidad capaz de neutralizarlo. */
  counteredBy: string;
  /** 1 = máxima prioridad. */
  threat: number;
};

export const VILLAINS: Villain[] = [
  { alias: 'Mirror Master', counteredBy: 'tecnología', threat: 1 },
  { alias: 'Killgrave', counteredBy: 'tecnología', threat: 2 },
  { alias: 'Mister Freeze', counteredBy: 'fuego', threat: 3 },
  { alias: 'Doctor Light', counteredBy: 'luz', threat: 4 },
  { alias: 'Juggernaut', counteredBy: 'telequinesis', threat: 5 },
  { alias: 'Solomon Grundy', counteredBy: 'luz', threat: 6 },
  { alias: 'The Shade', counteredBy: 'luz', threat: 7 },
  { alias: 'Heat Wave', counteredBy: 'fuego', threat: 8 },
  { alias: 'Captain Cold', counteredBy: 'fuego', threat: 9 },
  { alias: 'Brainiac', counteredBy: 'tecnología', threat: 10 },
  { alias: 'Magneto', counteredBy: 'telequinesis', threat: 11 },
  { alias: 'Firefly', counteredBy: 'fuego', threat: 12 },
];
