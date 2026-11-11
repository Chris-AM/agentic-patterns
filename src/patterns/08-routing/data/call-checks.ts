import { DEPARTMENTS, FALLBACK, type Route } from './departments.js';

// ---------------------------------------------------------------------------
// EL JUEZ PROGRAMÁTICO — la fuente de verdad del laboratorio
// ---------------------------------------------------------------------------

export type Check = {
  callId: number;
  expected: Route;
  routedTo: string;
  toolsUsed: string[];
};

/**
 * Determinista. Una llamada está resuelta SOLO si el departamento que la
 * atendió ejecutó la herramienta esperada. Como las herramientas son
 * disjuntas, una transferencia equivocada nunca puede pasar esta prueba.
 *
 * Fallback: se resuelve solo si la llamada fue a la ruta humana y no se
 * ejecutó ninguna herramienta.
 */
export function isResolved(check: Check) {
  if (check.expected === FALLBACK.route) {
    return check.routedTo === FALLBACK.route && check.toolsUsed.length === 0;
  }
  return check.toolsUsed.includes(DEPARTMENTS[check.expected].expectedTool);
}

export function auditCalls(checks: Check[]) {
  let passed = 0;

  for (const check of checks) {
    const ok = isResolved(check);
    if (ok) passed++;

    const mark = ok ? '✓'.green : '✗'.red;
    console.log(
      `     ${mark} llamada #${check.callId} → ${check.routedTo} ` +
        `(esperado: ${check.expected}) · tools: [${check.toolsUsed.join(', ')}]`
    );
  }

  console.log(`     → ${passed}/${checks.length} llamadas resueltas`.blue);
  return `${passed}/${checks.length}`;
}

export function toolNamesOf(steps: { toolCalls: { toolName: string }[] }[]) {
  return steps.flatMap((step) => step.toolCalls.map((call) => call.toolName));
}
