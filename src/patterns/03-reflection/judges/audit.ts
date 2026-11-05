// ---------------------------------------------------------------------------
// EL JUEZ PROGRAMÁTICO — la fuente de verdad del laboratorio
// ---------------------------------------------------------------------------

export type Check = { label: string; passed: boolean };

export function printAudit(checks: Check[]) {
  const passed = checks.filter((check) => check.passed).length;

  for (const check of checks) {
    const mark = check.passed ? '✓'.green : '✗'.red;
    console.log(`     ${mark} ${check.label}`);
  }
  console.log(`     → ${passed}/${checks.length} requisitos cumplidos`.blue);

  return passed;
}
