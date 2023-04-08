import {module as math} from '../demo/multicore-math';

test('can execute api() method without initializing a module first', async () => {
  const api = math.api();
  const res = await api.add([1, 2]).result;
  expect(res).toBe(3);
});

test('can execute the same call twice', async () => {
  const api = math.api();
  const res1 = await api.add([1, 2]).result;
  const res2 = await api.add([1, 2]).result;
  expect(res1).toBe(3);
  expect(res2).toBe(3);
});
