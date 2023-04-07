import {WorkerFn} from '../..';

export const sleep: WorkerFn<number | void, number> = async (cycles?) => {
  cycles = cycles || 100000;
  let i = 0;
  while (i < cycles) i++;
  return i;
};
