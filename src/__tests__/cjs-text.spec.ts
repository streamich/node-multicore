import {pool} from '..';

const text = /* js */ `

let state = 0;

exports.add = ([a, b]) => {
  return a + b;
}

exports.set = (value) => state = value;
exports.get = () => state;

`;

const module = pool.cjs(text);

test('can run cjs text module', async () => {
  const result = await module.exec('add', [1, 2]);
  expect(result).toEqual(3);
});

test('cjs module can store state', async () => {
  const pinned = module.pinned();
  const res1 = await pinned.ch('get', void 0).result;
  expect(res1).toBe(0);
  await pinned.ch('set', 1).result;
  const res2 = await pinned.ch('get', void 0).result;
  expect(res2).toBe(1);
  await pinned.ch('set', 2).result;
  const res3 = await pinned.ch('get', void 0).result;
  expect(res3).toBe(2);
});
