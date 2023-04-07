import {pool} from '../singleton';
import {init as markdownInit} from '../demo/multicore-markdown';
import {init as mathInit} from '../demo/multicore-math';
import {init as sleepInit} from '../demo/multicore-sleep';
import {init as testsInit} from '../demo/multicore-tests';
import {tick, until} from 'thingies';

beforeAll(async () => {
  await Promise.all([markdownInit(), mathInit(), sleepInit(), testsInit()]);
}, 30000);

test('initial pool starts with zero workers', async () => {
  expect(pool.size()).toBe(0);
});

test('pool adds one worker as first task is executed', async () => {
  const math = await mathInit();
  expect(pool.size()).toBe(0);
  const res = await math.exec('add', [1, 2]);
  expect(pool.size()).toBe(1);
  expect(res).toBe(3);
});

test('pool continues to have only one worker when tasks are executed sequentially', async () => {
  const math = await mathInit();
  expect(pool.size()).toBe(1);
  await math.exec('add', [1, 2]);
  expect(pool.size()).toBe(1);
  await math.exec('add', [1, 2]);
  expect(pool.size()).toBe(1);
  await math.exec('add', [1, 2]);
  expect(pool.size()).toBe(1);
  await math.exec('add', [1, 2]);
  expect(pool.size()).toBe(1);
});

test('once tasks compete for a thread, pool adds another worker', async () => {
  const math = await mathInit();
  expect(pool.size()).toBe(1);
  await Promise.all([
    math.exec('add', [1, 2]),
    math.exec('add', [1, 2]),
  ]);
  await Promise.all([
    math.exec('add', [1, 2]),
    math.exec('add', [1, 2]),
  ]);
  await Promise.all([
    math.exec('add', [1, 2]),
    math.exec('add', [1, 2]),
  ]);
  await until(() => pool.size() === 2);
  expect(pool.size()).toBe(2);
});

test('does not grow the pool size more, when concurrency is enough', async () => {
  const math = await mathInit();
  expect(pool.size()).toBe(2);
  await Promise.all([
    math.exec('add', [1, 2]),
    math.exec('add', [1, 2]),
  ]);
  await Promise.all([
    math.exec('add', [1, 2]),
    math.exec('add', [1, 2]),
  ]);
  await Promise.all([
    math.exec('add', [1, 2]),
    math.exec('add', [1, 2]),
  ]);
  expect(pool.size()).toBe(2);
  await tick(300);
  expect(pool.size()).toBe(2);
});

test('grows pool size when different methods are executed with high concurrency', async () => {
  const math = await mathInit();
  expect(pool.size()).toBe(2);
  await Promise.all([
    math.exec('add', [1, 2]),
    math.exec('multiply', [1, 2]),
    math.exec('subtract', [1, 2]),
    math.exec('add', [1, 2]),
    math.exec('multiply', [1, 2]),
    math.exec('subtract', [1, 2]),
    math.exec('add', [1, 2]),
    math.exec('multiply', [1, 2]),
    math.exec('subtract', [1, 2]),
  ]);
  await until(() => pool.size() === 3);
  expect(pool.size()).toBe(3);
});
