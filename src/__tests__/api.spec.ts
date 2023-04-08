import {module as math} from '../demo/multicore-math';

test('can execute api() method without initializing a module first', async () => {
  const api = math.api();
  const res = await api.add([1, 2]).result;
  expect(res).toBe(3);
});
