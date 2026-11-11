import { HEROES } from './heroes.js';
import { HOURS_PER_OPERATION } from './mission.js';
import { VILLAINS } from './villains.js';

// ---------------------------------------------------------------------------
// EL JUEZ PROGRAMÁTICO — regex y aritmética, cero criterio del modelo
// ---------------------------------------------------------------------------

// Recuerden que esto no es parte del patrón, simplemente es para verificar que el plan es válido.
export type Plan = {
  assignments: Record<string, string[]>;
  unhandled: string[];
};

export type Check = { label: string; passed: boolean };

export function auditPlan(plan: Plan | null): Check[] {
  const assignments =
    plan && typeof plan === 'object' ? plan.assignments ?? {} : {};
  const unhandled =
    plan && typeof plan === 'object' ? plan.unhandled ?? [] : [];

  const assigned = Object.values(assignments).flat();
  const all = [...assigned, ...unhandled];
  const aliases = VILLAINS.map((v) => v.alias);

  /**
   * SIN ESTA GUARDA EL JUEZ MIENTE.
   * Un plan vacío cumple "nadie excede sus horas" y "los grupos están
   * ordenados" por vacuidad: no hay nada que violar. Toda verificación
   * estructural exige que haya trabajo real que verificar.
   */
  const hasWork = assigned.length > 0;

  // 1. Cobertura exacta: los 12 villanos, ninguno repetido, ninguno inventado.
  const coverage =
    all.length === VILLAINS.length &&
    new Set(all).size === VILLAINS.length &&
    all.every((alias) => aliases.includes(alias));

  // 2. Cada asignación respeta la especialidad del héroe.
  const specialtyOk =
    hasWork &&
    Object.entries(assignments).every(([heroAlias, group]) => {
      const hero = HEROES.find((h) => h.alias === heroAlias);
      if (!hero) return false;

      const specialties = hero.specialty.split('|');
      return group.every((villainAlias) => {
        const villain = VILLAINS.find((v) => v.alias === villainAlias);
        return !!villain && specialties.includes(villain.counteredBy);
      });
    });

  // 3. Presupuesto de horas: nadie se pasa.
  const budgetOk =
    hasWork &&
    Object.entries(assignments).every(([heroAlias, group]) => {
      const hero = HEROES.find((h) => h.alias === heroAlias);
      return (
        !!hero && group.length * HOURS_PER_OPERATION <= hero.availableHours
      );
    });

  // 4. Cada grupo ordenado por amenaza ascendente.
  const sortedOk =
    hasWork &&
    Object.values(assignments).every((group) => {
      const threats = group.map(
        (alias) => VILLAINS.find((v) => v.alias === alias)?.threat ?? 999
      );
      return threats.every((threat, i) => i === 0 || threats[i - 1]! <= threat);
    });

  /**
   * 5. Los tres más urgentes deben estar ASIGNADOS.
   *    Ojo: "no estar en unhandled" no basta — un plan vacío también cumple
   *    eso. Hay que exigir presencia, no ausencia.
   */
  const urgentOk = [1, 2, 3].every((threat) => {
    const villain = VILLAINS.find((v) => v.threat === threat)!;
    return assigned.includes(villain.alias);
  });

  return [
    {
      label: 'Cobertura: los 12 villanos, sin repetir ni inventar',
      passed: coverage,
    },
    {
      label: 'Especialidad: cada héroe contrarresta de verdad',
      passed: specialtyOk,
    },
    { label: 'Presupuesto: nadie excede sus horas', passed: budgetOk },
    { label: 'Orden: grupos ordenados por amenaza', passed: sortedOk },
    { label: 'Urgencia: amenazas 1-3 cubiertas', passed: urgentOk },
  ];
}

export function printAudit(checks: Check[]) {
  const passed = checks.filter((check) => check.passed).length;

  for (const check of checks) {
    console.log(`     ${check.passed ? '✓'.green : '✗'.red} ${check.label}`);
  }
  console.log(
    `     → ${passed}/${checks.length} verificaciones superadas`.blue
  );

  return passed;
}
