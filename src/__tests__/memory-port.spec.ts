import {pool} from '..';
import {module as math} from '../demo/multicore-math';

test('can execute a simple call', async () => {
  const res = await math.exec('add', [1, 1]);
  expect(res).toBe(2);
});

const promises = () => [
  math.exec('add', [1, 1]),
  math.exec('add', [1, 2]),
  math.exec('add', [1, 3]),
  math.exec('add', [1, 4]),
  math.exec('add', [1, 5]),
  math.exec('add', [1, 6]),
  math.exec('add', [1, 7]),
  math.exec('add', [1, 8]),
  math.exec('add', [1, 9]),
  math.exec('add', [1, 10]),
  math.exec('add', [1, 11]),
  math.exec('add', [1, 12]),
  math.exec('add', [1, 13]),
  math.exec('add', [1, 14]),
  math.exec('add', [1, 15]),
];

test('can execute multiple calls in parallel', async () => {
  const promise = Promise.all(promises());
  const res = await promise;
  expect(res).toStrictEqual([
    2,  3,  4,  5,  6,  7,
    8,  9, 10, 11, 12, 13,
   14, 15, 16
  ]);
});

test('can execute multiple calls in parallel', async () => {
  const promise = Promise.all(promises());
  const res1 = await promise;
  expect(res1).toStrictEqual([
    2,  3,  4,  5,  6,  7,
    8,  9, 10, 11, 12, 13,
   14, 15, 16
  ]);
  const res2 = await promise;
  expect(res2).toStrictEqual([
    2,  3,  4,  5,  6,  7,
    8,  9, 10, 11, 12, 13,
   14, 15, 16
  ]);
});
