// Juez determinista: la respuesta correcta es Mirror Master (2 incidentes,
// integridad 41) y nadie más.
export function auditReport(text: string) {
  const lower = text.toLowerCase();
  const checks = [
    {
      label: 'Señala a Mirror Master con integridad 41',
      passed: lower.includes('mirror master') && /\b41\b/.test(text),
    },
    {
      label: 'No reporta integridad de los demás',
      passed: !/\b(97|88|73)\b/.test(text),
    },
  ];
  for (const check of checks) {
    console.log(`     ${check.passed ? '✓'.green : '✗'.red} ${check.label}`);
  }
  return checks.filter((c) => c.passed).length;
}
