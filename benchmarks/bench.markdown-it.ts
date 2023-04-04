// node -r ts-node/register benchmarks/util/worker-pool/bench.markdown-it.ts

import {Suite} from 'benchmark';
import {pool as getPool} from '../../../src/util/worker-pool';
import {parse} from './worker-markdown/methods';
import {init} from './worker-markdown';
import * as fs from 'fs';

// const md = fs.readFileSync(require.resolve('../../../README.md')).toString();
const md = '# Hello World';

const main = async () => {
  const pool = await getPool();
  const module = await init(pool);

  console.log(`Pool size: ${pool.size()}`);
  
  const execSingleCore = async () => {
    return await parse(md);
  };
  
  const execMultiCore = async () => {
    return await module.exec('parse', md);
  };

  console.log('single thread', await execSingleCore());
  console.log('worker pool', await execMultiCore());
  console.log('Running tasks:', pool.tasks());
  
  const concurrency = 100;
  const exec = async (fn: () => Promise<unknown>) => {
    const promises: Promise<unknown>[] = [];
    for (let i = 0; i < concurrency; i++) promises.push(fn());
    await Promise.all(promises);
  };
  
  const suite = new Suite();
  
  suite
    .add(`single threaded`, async () => {
      return await exec(execSingleCore);
    }, {async: true})
    .add(`worker pool`, async () => {
      return await exec(execMultiCore);
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
