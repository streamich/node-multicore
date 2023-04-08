import {WorkerPool} from '../WorkerPool';

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
