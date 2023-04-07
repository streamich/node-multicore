/* tslint:disable no-console */

// This file is used to test the worker pool. Run:
//
//     yarn demo
//
//     or
//
//     node -r ts-node/register src/demo/demo.ts

import {WorkerPool, pool as defaultPool} from '..';
import {ok, equal, deepEqual} from 'assert';
import {of} from 'thingies/es2020';
import {module as mathModule} from './multicore-math';
import {module as testsModule} from './multicore-tests';

const createPool = async (): Promise<WorkerPool> => {
  const pool = new WorkerPool();
  await Promise.all([pool.addWorker(), pool.addWorker()]);
  return pool;
};

const main = async () => {
  console.log('Testing WorkerPool.');
  console.log();

  // Create a thread pool with at least one thread.
  const pool = Math.random() > 0.5 ? await createPool() : defaultPool;

  // Load a module.
  const math = (await mathModule.init()).api();

  // Add 2 workers to the pool.
  await Promise.all([pool.addWorker(), pool.addWorker()]);

  // Load another module.
  const tests = (await testsModule.init()).api();
  // const testsPinned = tets.get(testsWorker.file)!.typed<testsWorker.Methods>().api(pool.worker());

  ok((await math.add([1, 2]).result) === 3, 'can execute math.add');
  ok((await math.add([2, 6], []).result) === 8, 'can execute math.add with transfer list');
  ok((await math.subtract([1, 2]).result) === -1, 'can execute math.subtract');
  console.log('✅', 'can execute simple addition and subtraction');

  ok((await tests.constant().result) === '25', 'can execute tests.constant');
  ok((await tests.constantAsync().result) === '25', 'can execute tests.constantAsync');
  console.log('✅', 'can retrieve a constant from a worker module');

  deepEqual(
    await Promise.all([
      tests.constant().result,
      tests.constant().result,
      tests.constant().result,
      tests.constantAsync().result,
      tests.constant().result,
      tests.constantAsync().result,
    ]),
    ['25', '25', '25', '25', '25', '25'],
    'can execute multiple simple in parallel',
  );
  console.log('✅', 'can execute requests in parallel to the same module');

  deepEqual(
    await Promise.all([
      math.add([1, 1]).result,
      math.add([1, 2]).result,
      math.add([1, 3]).result,
      math.add([4, 1]).result,
      math.subtract([4, 1]).result,
      tests.echo('hello').result,
      math.multiply([3, 2]).result,
      math.multiply([3, 2]).result,
      math.multiply([3, 2]).result,
      math.pow([2, 1]).result,
      math.pow([2, 2]).result,
      math.pow([2, 3]).result,
      math.pow([2, 4]).result,
      tests.constant().result,
    ]),
    [2, 3, 4, 5, 3, 'hello', 6, 6, 6, 2, 4, 8, 16, '25'],
    'can execute many different requests in parallel',
  );
  console.log('✅', 'can execute requests in parallel to different modules');

  const [, err1] = await of(tests.throwsString().result);
  ok(err1 === 'OMG!', 'can synchronously throw string');
  console.log('✅', 'can synchronously throw string');

  const [, err2] = await of(tests.throwsStringAsync().result);
  ok(err2 === 'OMG!', 'can asynchronously throw string');
  console.log('✅', 'can asynchronously throw string');

  const [, err3] = await of(tests.throwsError().result);
  deepEqual(err3, new Error('OMG!'), 'can synchronously throw native error');
  console.log('✅', 'can synchronously throw native error');

  const [, err4] = await of(tests.throwsErrorAsync().result);
  deepEqual(err4, new Error('OMG!'), 'can asynchronously throw native error');
  console.log('✅', 'can asynchronously throw native error');

  // ok((await testsPinned.get().promise) === undefined, 'can return "undefined" value');
  // console.log('✅', 'can return "undefined" value');

  // await testsPinned.set('foo').promise;
  // equal(await testsPinned.get().promise, 'foo', 'can set and get value in module closure');
  // await testsPinned.set('foo 2').promise;
  // ok((await testsPinned.get().promise) === 'foo 2', 'can set and get value in module closure');
  // await testsPinned.set('foo 3').promise;
  // ok((await testsPinned.get().promise) === 'foo 3', 'can set and get value in module closure');
  // console.log('✅', 'can store state in module closure');

  const buf = await tests.bufferSet({arr: new Uint8Array([1, 2, 3]), pos: 1, octet: 25}).result;
  deepEqual(buf, new Uint8Array([1, 25, 3]), 'can send and receive typed arrays');
  console.log('✅', 'can send and receive typed arrays');

  const arr = new Uint8Array([1, 2, 3]);
  const buf2 = await tests.bufferSet({arr, pos: 2, octet: 44}, [arr.buffer]).result;
  equal(arr.length, 0, 'buffer on transfer list gets transferred');
  deepEqual(buf2, new Uint8Array([1, 2, 44]), 'can modify typed array which was transferred');
  console.log('✅', 'buffer on transfer list gets transferred');

  const arr2 = new Uint8Array([1, 2, 3]);
  const buf3 = await tests.bufferSetTransfer({arr: arr2, pos: 0, octet: 55}, [arr2.buffer]).result;
  deepEqual(buf3, new Uint8Array([55, 2, 3]), 'can transfer buffer both ways');
  console.log('✅', 'can transfer buffer both ways');

  equal(await tests.lol().result, 123, 'can fetch a constant from a worker module');
  console.log('✅', 'can fetch a constant from a worker module');

  const channel = math.addThreeNumbers(3);
  channel.send(4);
  channel.send(5);
  const channelResult = await channel.result;
  ok(channelResult === 3 + 4 + 5, 'can use channels in a worker thread');
  console.log('✅', 'can use channel to stream more data to a worker thread');

  console.log();
  console.log('All WorkerPool tests passed.');
};

main();
