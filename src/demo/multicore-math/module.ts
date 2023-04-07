import {type WorkerFn, taker, msg, type WorkerCh} from '../..';

export const add: WorkerFn<[number, number], number> = ([a, b]) => {
  return msg(a + b, []);
};

export const subtract: WorkerFn<[number, number], number> = ([a, b]) => a - b;

export const multiply: WorkerFn<[number, number], number> = ([a, b]) => {
  return msg(a * b, []);
};

export const pow: WorkerFn<[number, number], number> = ([a, b]) => {
  return a ** b;
};

export const addThreeNumbers: WorkerCh<number, number, number, void> = async (one, send, recv) => {
  const take = taker(recv);
  const two = await take();
  const three = await take();
  return one + two + three;
};
