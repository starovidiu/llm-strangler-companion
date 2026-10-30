import test from 'node:test';
import assert from 'node:assert/strict';
import {createGateway} from '../src/gateway.js';
import {createBreaker} from '../src/breaker.js';

const ticket = {tenantId: 'tenant-1', description: 'API login error'};
const legacy = {queue: 'Technical', reason: 'Legacy rules'};
const valid = {queue: 'General', reason: 'Demo model output'};

// A model adapter must honor AbortSignal for timeout to bound underlying work.
test('timeout aborts provider and falls back', async () => {
  let aborted = false;
  const model = (_ticket, {signal}) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => {
      aborted = true; reject(new Error('aborted'));
    }, {once: true});
  });
  const gateway = createGateway({model, percentage: 100, timeoutMs: 10});
  assert.deepEqual(await gateway.classify(ticket), legacy);
  assert.equal(aborted, true);
});

test('invalid schema falls back', async () => {
  const gateway = createGateway({model: async () => ({queue: 'Admin', reason: 'No'}), percentage: 100});
  assert.deepEqual(await gateway.classify(ticket), legacy);
});

test('open circuit bypasses model and falls back', async () => {
  let calls = 0;
  const breaker = createBreaker({threshold: 1, resetMs: 60_000});
  const gateway = createGateway({percentage: 100, breaker, model: async () => {
    calls++; throw new Error('offline');
  }});
  assert.deepEqual(await gateway.classify(ticket), legacy);
  assert.equal(breaker.state, 'open');
  assert.deepEqual(await gateway.classify(ticket), legacy);
  assert.equal(calls, 1);
});

test('healthy model can classify eligible tickets', async () => {
  const gateway = createGateway({percentage: 100, model: async () => valid});
  assert.deepEqual(await gateway.classify(ticket), valid);
});

test('disabled flag does not call model', async () => {
  const gateway = createGateway({percentage: 0, model: async () => {throw Error('called');}});
  assert.deepEqual(await gateway.classify(ticket), legacy);
});
