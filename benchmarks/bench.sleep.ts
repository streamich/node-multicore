// node -r ts-node/register benchmarks/util/worker-pool/bench.sleep.ts

import {Suite} from 'benchmark';
import {pool as getPool} from '../../../src/util/worker-pool';
import {sleep} from './worker-sleep/methods';
import {init} from './worker-sleep';

const main = async () => {
  const pool = await getPool();
  const module = await init(pool);

  console.log(`Pool size: ${pool.size()}`);
  
  const execSingleCore = async () => {
    return await sleep();
  };
  
  const execMultiCore = async () => {
    return await module.exec('sleep', undefined);
  };

  console.log('single thread', await execSingleCore());
  console.log('worker pool', await execMultiCore());
  console.log('Running tasks:', pool.tasks());
  
  const concurrency = pool.size();
  const exec = async (fn: () => Promise<unknown>) => {
    const promises: Promise<unknown>[] = [];
    for (let i = 0; i < concurrency; i++) promises.push(fn());
    await Promise.all(promises);
  };
  
  const suite = new Suite;
  
  suite
    .add(`single threaded`, async () => {
      await exec(execSingleCore);
    }, {async: true})
    .add(`worker pool`, async () => {
      await exec(execMultiCore);
    }, {async: true})
    .on('cycle', (event: any) => {
      console.log(String(event.target) + `, ${Math.round(1000000000 / event.target.hz)} ns/op`);
    })
    .on('complete', () => {
      console.log('Fastest is ' + suite.filter('fastest').map('name'));
      console.log('Running tasks:', pool.tasks());
    })
    .run();
};

main();
