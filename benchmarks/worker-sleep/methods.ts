import {WorkerFn} from '../../src';

export const sleep: WorkerFn<void, number> = async () => {
  let i = 0;
  while (i < 100000) i++;
  return i;
};

// These methods will be picked up by worker threads.
export const methods = {
  sleep,
};

// This type will be used in the main thread.
export type Methods = typeof methods;
