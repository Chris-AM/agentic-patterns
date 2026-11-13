import { MockLanguageModelV4 } from 'ai/test';

/** Modelo simulado: responde los textos indicados, en orden, sin llamar a ningún proveedor. */
export function mockModel(...texts: string[]) {
  return new MockLanguageModelV4({
    doGenerate: texts.map((text) => ({
      content: [{ type: 'text' as const, text }],
      finishReason: { unified: 'stop' as const, raw: undefined },
      usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 1, text: 1, reasoning: 0 },
      },
      warnings: [],
    })),
  });
}

/** Todo lo que el modelo recibió en una llamada, como texto, para buscar en él. */
export const sentTo = (model: MockLanguageModelV4, call = 0) =>
  JSON.stringify(model.doGenerateCalls[call]);
