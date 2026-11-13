import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PLATFORMS, searchUpcomingGames } from './search-upcoming-games.js';

const schema = searchUpcomingGames.inputSchema as { safeParse: (v: unknown) => { success: boolean } };

test('el enum de plataformas se deriva de PLATFORMS', () => {
  for (const platform of Object.keys(PLATFORMS)) {
    assert.equal(schema.safeParse({ platform }).success, true, platform);
  }
  assert.equal(schema.safeParse({ platform: 'sega' }).success, false);
});

test('si la red falla, la tool devuelve el error como observación (no lanza) y usa timeout', async () => {
  const original = globalThis.fetch;
  let receivedSignal: AbortSignal | undefined;
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    receivedSignal = init?.signal ?? undefined;
    throw new TypeError('fetch failed');
  }) as typeof fetch;

  try {
    const output = await searchUpcomingGames.execute!(
      { platform: 'pc', days: 90, limit: 10 },
      { toolCallId: 't', messages: [] } as never
    );
    assert.match(JSON.stringify(output), /error/);
    assert.ok(receivedSignal, 'fetch debe recibir una señal de timeout');
  } finally {
    globalThis.fetch = original;
  }
});
