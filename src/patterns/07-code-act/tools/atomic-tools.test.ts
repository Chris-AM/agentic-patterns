import { test } from 'node:test';
import assert from 'node:assert/strict';

import { planFromSteps, validateAssignment } from './atomic-tools.js';

function assignStep(heroAlias: string, villainAlias: string) {
  return {
    toolResults: [
      {
        toolName: 'assignHero',
        input: { heroAlias, villainAlias },
        output: validateAssignment(heroAlias, villainAlias),
      },
    ],
  };
}

test('validateAssignment rechaza alias inventados', () => {
  assert.equal(validateAssignment('Iron Man', 'Mirror Master').registered, true);
  assert.equal(validateAssignment('Thor', 'Mirror Master').registered, false);
  assert.equal(validateAssignment('Iron Man', 'Thanos').registered, false);
});

test('planFromSteps agrupa por héroe a partir de la traza', () => {
  const plan = planFromSteps([
    assignStep('Iron Man', 'Mirror Master'),
    { toolResults: [{ toolName: 'getNextHero', input: {}, output: {} }] },
    assignStep('Iron Man', 'Killgrave'),
    assignStep('Antorcha Humana', 'Mister Freeze'),
  ]);

  assert.deepEqual(plan, {
    assignments: {
      'Iron Man': ['Mirror Master', 'Killgrave'],
      'Antorcha Humana': ['Mister Freeze'],
    },
    unhandled: [],
  });
});

test('planFromSteps ignora asignaciones rechazadas y reintentos', () => {
  const plan = planFromSteps([
    assignStep('Thor', 'Mirror Master'),
    assignStep('Iron Man', 'Mirror Master'),
    assignStep('Iron Man', 'Mirror Master'),
  ]);

  assert.deepEqual(plan.assignments, { 'Iron Man': ['Mirror Master'] });
});
