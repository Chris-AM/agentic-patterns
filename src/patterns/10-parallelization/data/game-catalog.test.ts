import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildCatalog } from './game-catalog.js';

const search = (platform: string, games: { title: string; released: string; hype: number }[]) => ({
  toolName: 'searchUpcomingGames',
  output: { platform, games },
});

const POP = { title: 'Prince of Persia Remake', released: '2026-12-31', hype: 1045 };

test('buildCatalog deduplica por código los juegos multiplataforma', () => {
  const catalog = buildCatalog([
    { topic: 'PC', subject: 'pc', notes: '', data: [search('pc', [POP, { title: 'Path of Exile 2', released: '2026-12-11', hype: 300 }])] },
    { topic: 'PS', subject: 'playstation', notes: '', data: [search('playstation', [POP])] },
  ]);

  assert.equal(catalog.length, 2);
  const pop = catalog.find((game) => game.title === POP.title)!;
  assert.deepEqual(pop.platforms, ['pc', 'playstation']);
});

test('buildCatalog ignora errores de la tool y salidas de otras tools', () => {
  const catalog = buildCatalog([
    {
      topic: 'X',
      subject: 'xbox',
      notes: '',
      data: [
        { toolName: 'searchUpcomingGames', output: { error: 'RAWG respondió 500' } },
        { toolName: 'otraTool', output: { games: [POP] } },
      ],
    },
  ]);
  assert.deepEqual(catalog, []);
});
