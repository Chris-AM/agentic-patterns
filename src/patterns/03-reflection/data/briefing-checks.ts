import type { Check } from '../judges/audit.js';

// ---------------------------------------------------------------------------
// REGLAS DEL JUEZ PARA ESTE CASO — conocimiento de la instancia
// ---------------------------------------------------------------------------

/**
 * Verificación determinista. No usa el modelo: por eso no se deja engañar
 * cuando el modelo afirma que su propio texto "cumple todo".
 */
export function auditBriefing(text: string): Check[] {
  const lower = text.toLowerCase();

  return [
    { label: 'Nombre real', passed: lower.includes('mcculloch') },
    {
      label: 'Contramedida',
      passed: /espejo|reflectante|superficie/.test(lower),
    },
    {
      label: 'Ubicación',
      passed: /almac[eé]n\s*7|distrito industrial/.test(lower),
    },
    { label: 'Cómplices', passed: lower.includes('killgrave') },
    { label: 'Recompensa', passed: /250[\s.,]?000/.test(text) },
    { label: 'Línea RIESGO:', passed: /^RIESGO:/m.test(text) },
    { label: '≤ 120 palabras', passed: text.trim().split(/\s+/).length <= 120 },
  ];
}
