import {WorkerPool} from './WorkerPool';

let pool: WorkerPool | undefined;
let threadsStarted = false;
let threadsPromise: undefined | Promise<void>;

const loadThreads = (): Promise<void> => {
  if (threadsPromise) return threadsPromise;
  const cpuCountLessOne = require('os').cpus().length - 1;
  const maxThreads = +(process.env.MC_MAX_THREADPOOL_SIZE || '') || 12;
  const threadCount = Math.min(Math.max(cpuCountLessOne, 1), maxThreads);
  if (!pool) pool = new WorkerPool();
  threadsPromise = pool
    .addWorkers(threadCount)
    .then(() => {
      threadsStarted = true;
    })
    .catch(() => {});
  return threadsPromise;
};

export const getSharedPool = async (): Promise<WorkerPool> => {
  if (!threadsStarted) await loadThreads();
  return pool!;
};
