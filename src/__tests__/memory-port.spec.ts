import {module as math} from '../demo/multicore-math';
import {module as demo} from '../demo/multicore-demo-module';
import {pool} from '../singleton';

beforeAll(async () => {
  await math.init();
});

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
  math.exec('add', [1, 16]),
  math.exec('add', [1, 17]),
  math.exec('add', [1, 18]),
  math.exec('add', [1, 19]),
  math.exec('add', [1, 20]),
  math.exec('add', [1, 21]),
  math.exec('add', [1, 22]),
  math.exec('add', [1, 23]),
  math.exec('add', [1, 24]),
];

test('can execute multiple calls in parallel', async () => {
  const promise = Promise.all(promises());
  const res = await promise;
  expect(res).toStrictEqual([
    2,  3,  4,  5,  6,  7,
    8,  9, 10, 11, 12, 13,
    14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25
  ]);
});

test('can execute multiple calls in parallel', async () => {
  const res1 = await Promise.all(promises());
  expect(res1).toStrictEqual([
    2,  3,  4,  5,  6,  7,
    8,  9, 10, 11, 12, 13,
    14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25
  ]);
  const res2 = await Promise.all(promises());
  expect(res2).toStrictEqual([
    2,  3,  4,  5,  6,  7,
    8,  9, 10, 11, 12, 13,
    14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25
  ]);
});

test('can execute demo module loop', async () => {
  await demo.exec('loop', undefined);
});

test.only('can execute demo module loop in parallel', async () => {
  const call = () => demo.exec('loop', undefined);
  const run = (concurrency: number) => Promise.all(Array.from({length: concurrency}, call));
  for (let i = 0; i < 14; i++) {
    await run(8);
    await run(16);
    await run(32);
    // await run(64);
  }

  // console.log((pool as any).workers[0].memory.outgoing.slots)
});
