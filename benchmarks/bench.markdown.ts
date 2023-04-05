// node -r ts-node/register benchmarks/bench.markdown.ts

import {Bench} from 'tinybench';
import {getSharedPool} from '../src';
import {parse} from '../src/demo/multicore-markdown/methods';
import {init} from '../src/demo/multicore-markdown';
import {md} from './md';

const main = async () => {
  const pool = await getSharedPool();
  const module = await init(pool);

  console.log(`Pool size: ${pool.size()}`);
  
  const execSingleCore = async () => {
    return await parse(md);
  };
  
  const execMultiCore = async () => {
    return await module.exec('parse', md);
  };

  // console.log('single thread', await execSingleCore());
  // console.log('worker pool', await execMultiCore());
  console.log('Running tasks:', pool.tasks());
  
  const concurrency = pool.size();
  const exec = async (fn: () => Promise<unknown>) => {
    const promises: Promise<unknown>[] = [];
    for (let i = 0; i < concurrency; i++) promises.push(fn());
    await Promise.all(promises);
  };
  
  const bench = new Bench;
  
  bench
    .add(`single threaded`, async () => await exec(execSingleCore))
    .add(`worker pool`, async () => await exec(execMultiCore));
  
  await bench.run();

  console.table(bench.tasks.map(({ name, result }) => ({ "Task Name": name, "Average Time (ps)": result?.mean! * 1000, "Variance (ps)": result?.variance! * 1000 })));
};

main();
