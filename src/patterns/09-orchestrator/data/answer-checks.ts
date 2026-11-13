// ---------------------------------------------------------------------------
// EL JUEZ PROGRAMÁTICO — la fuente de verdad del laboratorio
// ---------------------------------------------------------------------------

export type Check = { label: string; passed: boolean };

/**
 * Determinista: busca en la respuesta final los tres identificadores.
 * Solo existen como resultado de las tools, así que verlos en el texto
 * prueba que el departamento trabajó Y que su resultado llegó al cliente.
 */
export function auditAnswer(text: string): Check[] {
  return [
    { label: 'Facturación: factura INV-####', passed: /INV-\d{4}/.test(text) },
    { label: 'Soporte: ticket TK-####', passed: /TK-\d{4}/.test(text) },
    { label: 'Ventas: catálogo CAT-####', passed: /CAT-\d{4}/.test(text) },
  ];
}

export function printAudit(checks: Check[]) {
  const passed = checks.filter((c) => c.passed).length;
  for (const check of checks) {
    console.log(`     ${check.passed ? '✓'.green : '✗'.red} ${check.label}`);
  }
  console.log(`     → ${passed}/${checks.length} partes resueltas`.blue);
  return `${passed}/${checks.length}`;
}
