import {type WorkerFn, taker, msg, type WorkerCh} from '../..';

const add: WorkerFn<[number, number], number> = ([a, b]) => {
  return msg(a + b, []);
};

const subtract: WorkerFn<[number, number], number> = ([a, b]) => a - b;

const multiply: WorkerFn<[number, number], number> = ([a, b]) => {
  return msg(a * b, []);
};

const pow: WorkerFn<[number, number], number> = ([a, b]) => {
  return a ** b;
};

const addThreeNumbers: WorkerCh<number, number, number, void> = async (one, send, recv) => {
  const take = taker(recv);
  const two = await take();
  const three = await take();
  return one + two + three;
};

// These methods will be picked up by worker threads.
export const external = {
  add,
  subtract,
  multiply,
  pow,
  addThreeNumbers,
};

// This type will be used in the main thread.
export type Methods = typeof external;
