import {WorkerPool} from './WorkerPool';

export const pool = new WorkerPool();

export const getSharedPool = async (): Promise<WorkerPool> => {
  return pool!;
};
