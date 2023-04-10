/* tslint:disable no-console */

// This file is used to test the worker pool. Run:
//
//     yarn demo
//
//     or
//
//     node -r ts-node/register src/demo/demo-simple.ts

import {pool} from '..';
import {module as math} from './multicore-math';

const main = async () => {
  const api = math.api();

  const res1 = await api.add([1, 1]).result;
  console.log('res1', res1);
  // console.log((pool as any).workers[0].memory.outgoing.slots)

  const res2 = await api.add([1, 1]).result;
  console.log('res2', res2);

  const res3 = await api.add([1, 1]).result;
  console.log('res3', res2);
 
  const res4 = await Promise.all([
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
  ]);
  console.log('res4', res4);
 
  const res5 = await Promise.all([
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
    api.add([1, 1]).result,
  ]);
  console.log('res5', res5);

};

main();
