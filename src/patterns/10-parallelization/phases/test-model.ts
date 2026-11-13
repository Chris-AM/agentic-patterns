import { MockLanguageModelV4 } from 'ai/test';

type Reply = string | { toolCall: { toolName: string; input: unknown } };

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};

/**
 * Modelo simulado: responde en orden, sin llamar a ningún proveedor.
 * Un string es una respuesta de texto; `{ toolCall }` es una llamada a una tool.
 */
export function mockModel(...replies: Reply[]) {
  return new MockLanguageModelV4({
    doGenerate: replies.map((reply, i) =>
      typeof reply === 'string'
        ? {
            content: [{ type: 'text' as const, text: reply }],
            finishReason: { unified: 'stop' as const, raw: undefined },
            usage,
            warnings: [],
          }
        : {
            content: [
              {
                type: 'tool-call' as const,
                toolCallId: `call-${i}`,
                toolName: reply.toolCall.toolName,
                input: JSON.stringify(reply.toolCall.input),
              },
            ],
            finishReason: { unified: 'tool-calls' as const, raw: undefined },
            usage,
            warnings: [],
          }
    ),
  });
}

/** Todo lo que el modelo recibió en una llamada, como texto, para buscar en él. */
export const sentTo = (model: MockLanguageModelV4, call = 0) =>
  JSON.stringify(model.doGenerateCalls[call]);
