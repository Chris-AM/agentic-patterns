import { ID_PREFIX } from '../tools/department-tools.js';
import { DEPARTMENTS, type Department } from './departments.js';

// ---------------------------------------------------------------------------
// EL JUEZ PROGRAMÁTICO — la fuente de verdad del laboratorio
// ---------------------------------------------------------------------------

export type Check = { label: string; passed: boolean };

type StepLike = { toolResults: ReadonlyArray<{ output: unknown }> };

/** Prefijo del ID que emite el departamento (derivado de su única tool). */
function prefixOf(department: Department) {
  const toolName = Object.keys(DEPARTMENTS[department].tools)[0] as keyof typeof ID_PREFIX;
  return ID_PREFIX[toolName];
}

const ID_PATTERN = new RegExp(`\\b(?:${Object.values(ID_PREFIX).join('|')})-\\d{4}\\b`, 'g');

/**
 * IDs realmente emitidos, leídos de la traza (mejora 2): los campos `*Id` de
 * las tools de los workers y los `issuedIds` que propaga cada delegación.
 */
export function collectIds(steps: ReadonlyArray<StepLike>): string[] {
  const ids: string[] = [];

  for (const { output } of steps.flatMap((step) => step.toolResults)) {
    if (!output || typeof output !== 'object') continue;
    for (const [key, value] of Object.entries(output)) {
      if (key.endsWith('Id') && typeof value === 'string') ids.push(value);
      if (key === 'issuedIds' && Array.isArray(value)) ids.push(...value);
    }
  }

  return ids;
}

/** IDs con forma válida en el texto que nadie emitió: el modelo los inventó. */
export function inventedIds(text: string, issuedIds: readonly string[]) {
  return [...text.matchAll(ID_PATTERN)]
    .map((match) => match[0])
    .filter((id) => !issuedIds.includes(id));
}

/**
 * Determinista. Antes bastaba con que el texto trajera algo con forma
 * `INV-####`, y un ID inventado pasaba la prueba. Ahora la parte se resuelve
 * solo si el texto contiene un ID que la tool REALMENTE emitió (forma ≠ significado).
 */
export function auditAnswer(text: string, issuedIds: readonly string[]): Check[] {
  return (Object.keys(DEPARTMENTS) as Department[]).map((department) => {
    const prefix = prefixOf(department);
    return {
      label: `${department}: ${prefix}-#### emitido`,
      passed: issuedIds.some((id) => id.startsWith(`${prefix}-`) && text.includes(id)),
    };
  });
}

export function printAudit(checks: Check[], invented: string[] = []) {
  const passed = checks.filter((c) => c.passed).length;
  for (const check of checks) {
    console.log(`     ${check.passed ? '✓'.green : '✗'.red} ${check.label}`);
  }
  if (invented.length) {
    console.log(`     ⚠️  IDs inventados (nadie los emitió): ${invented.join(', ')}`.red);
  }
  console.log(`     → ${passed}/${checks.length} partes resueltas`.blue);
  return `${passed}/${checks.length}`;
}
