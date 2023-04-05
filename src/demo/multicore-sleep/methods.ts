import {WorkerFn} from '../..';

export const sleep: WorkerFn<number | void, number> = async (cycles?) => {
  cycles = cycles || 100000;
  let i = 0;
  while (i < cycles) i++;
  return i;
};

// These methods will be picked up by worker threads.
export const methods = {
  sleep,
};

// This type will be used in the main thread.
export type Methods = typeof methods;
