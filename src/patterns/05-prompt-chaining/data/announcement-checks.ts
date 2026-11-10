import { MAX_CHARS, MIN_CHARS, COURSE } from './announcement.js';
import type { Check } from '../judges/audit.js';

// ---------------------------------------------------------------------------
// EL JUEZ PROGRAMÁTICO
// ---------------------------------------------------------------------------

export function auditAnnouncement(text: string): Check[] {
  return [
    {
      label: `≤ ${MAX_CHARS} caracteres (${text.length})`,
      passed: text.length <= MAX_CHARS,
    },
    {
      label: `Mínimo ${MIN_CHARS} caracteres. Actual: ${
        text.length
      }. (falta: ${MIN_CHARS - text.length})`,
      passed: text.length >= MIN_CHARS,
    },
    { label: 'Título exacto', passed: text.includes(COURSE.title) },
    { label: 'Precio', passed: /34[.,]99/.test(text) },
    { label: 'Enlace', passed: text.includes(COURSE.url) },
    { label: 'Sin markdown', passed: !/[#*_`]/.test(text) },
    {
      label: 'Sin emojis',
      passed:
        !/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(
          text
        ),
    },
  ];
}
