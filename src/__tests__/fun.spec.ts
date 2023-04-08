import {WorkerPool, fun} from '..';

test('can execute an sync function in worker pool', async () => {
  const pool = new WorkerPool();
  const module = pool.fun(([a, b]: any) => a + b);
  const result = await module.exec('default', [1, 2]);
  expect(result).toBe(3);
});

test('can execute an async function in worker pool', async () => {
  const pool = new WorkerPool();
  const module = pool.fun(async ([a, b]: any) => a + b);
  const result = await module.exec('default', [1, 2]);
  expect(result).toBe(3);
});

test('can create a function in pool using fun() helper', async () => {
  const fn = fun((a: number, b: number) => a * b);
  const result = await fn(4, 3);
  expect(result).toBe(12);
});
