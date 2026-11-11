/** Los modelos a veces envuelven el código en ```js ... ```. */
export function extractCode(raw: string): string {
  const fenced = raw.match(
    /```(?:js|javascript|ts|typescript)?\n([\s\S]*?)```/
  );
  return (fenced?.[1] ?? raw).trim();
}
