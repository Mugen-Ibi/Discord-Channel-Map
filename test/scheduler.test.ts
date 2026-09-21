import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createScheduler } from '../src/scheduler.js';

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

test('debounces bursts for three seconds after the last event', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  let calls = 0;
  const scheduler = createScheduler(async () => { calls++; }, assert.fail);
  t.after(() => scheduler.stop());
  scheduler.request();
  t.mock.timers.tick(2000);
  scheduler.request();
  t.mock.timers.tick(2999);
  assert.equal(calls, 0);
  t.mock.timers.tick(1);
  await flush();
  assert.equal(calls, 1);
});

test('serializes updates and preserves changes arriving during a write', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  let release!: () => void;
  let calls = 0;
  const scheduler = createScheduler(async () => { calls++; if (calls === 1) await new Promise<void>(resolve => { release = resolve; }); }, assert.fail);
  t.after(() => scheduler.stop());
  scheduler.request(true);
  t.mock.timers.tick(0);
  scheduler.request();
  t.mock.timers.tick(3000);
  assert.equal(calls, 1);
  release();
  await flush();
  t.mock.timers.tick(0);
  assert.equal(calls, 2);
});

test('retries failures after 30 seconds; shutdown cancels future work', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  let calls = 0;
  let errors = 0;
  const scheduler = createScheduler(async () => { calls++; throw new Error('offline'); }, () => { errors++; });
  scheduler.request(true);
  t.mock.timers.tick(0);
  await flush();
  assert.equal(errors, 1);
  t.mock.timers.tick(29999);
  assert.equal(calls, 1);
  t.mock.timers.tick(1);
  await flush();
  assert.equal(calls, 2);
  scheduler.stop();
  scheduler.request(true);
  t.mock.timers.tick(60000);
  assert.equal(calls, 2);
});
