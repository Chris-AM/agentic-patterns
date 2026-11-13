import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createTracer } from '../../../helpers/index.js';
import { DEPARTMENT_NAMES } from '../data/departments.js';
import { delegationTools } from './delegate-to.js';

test('delegationTools deriva una tool por departamento', () => {
  const tools = delegationTools({ stepBudget: 3, tracer: createTracer('test') });
  assert.deepEqual(Object.keys(tools), [
    'delegateToVentas',
    'delegateToSoporte',
    'delegateToFacturacion',
  ]);
  assert.equal(Object.keys(tools).length, DEPARTMENT_NAMES.length);
});
