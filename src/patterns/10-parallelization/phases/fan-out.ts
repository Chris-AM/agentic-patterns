// ---------------------------------------------------------------------------
// FAN-OUT — ejecutar en paralelo tolerando fallos parciales y lentitud
// ---------------------------------------------------------------------------
/**
 * `Promise.all` rechaza TODO si un solo worker falla: se pierden también los
 * que terminaron bien. Aquí cada item termina como `ok: true` o `ok: false`
 * (Promise.allSettled) y tiene su propio techo de tiempo: el más lento no
 * define la latencia de todos. El worker recibe una señal para cortar su
 * trabajo (ej. `abortSignal` de generateText) cuando se agota su tiempo.
 */
export type FanOutResult<T, R> =
  | { item: T; ok: true; value: R }
  | { item: T; ok: false; error: string };

export async function fanOut<T, R>(
  items: readonly T[],
  worker: (item: T, signal: AbortSignal) => Promise<R>,
  { timeoutMs }: { timeoutMs: number }
): Promise<FanOutResult<T, R>[]> {
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError(`timeoutMs debe ser un entero mayor que 0 (recibido: ${timeoutMs})`);
  }

  const settled = await Promise.allSettled(
    items.map((item) => {
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;

      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error(`timeout: superó ${timeoutMs} ms`));
        }, timeoutMs);
      });

      // Aunque el worker ignore la señal, el race garantiza que el item termine.
      return Promise.race([worker(item, controller.signal), timeout]).finally(() =>
        clearTimeout(timer)
      );
    })
  );

  return settled.map((result, i) =>
    result.status === 'fulfilled'
      ? { item: items[i]!, ok: true as const, value: result.value }
      : {
          item: items[i]!,
          ok: false as const,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        }
  );
}
