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
