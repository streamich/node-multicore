import {WorkerPool} from './WorkerPool';

let __pool: WorkerPool | undefined;
let threadsStarted = false;
let threadsPromise: undefined | Promise<void>;

const loadThreads = (): Promise<void> => {
  if (threadsPromise) return threadsPromise;
  const cpuCountLessOne = require('os').cpus().length - 1;
  const maxThreads = +(process.env.WP_MAX_THREADPOOL_SIZE || '') || 12;
  const threadCount = Math.min(Math.max(cpuCountLessOne, 1), maxThreads);
  if (!__pool) __pool = new WorkerPool();
  threadsPromise = __pool
    .addWorkers(threadCount)
    .then(() => {
      threadsStarted = true;
    })
    .catch(() => {});
  return threadsPromise;
};

export const pool = async (): Promise<WorkerPool> => {
  if (!threadsStarted) await loadThreads();
  return __pool!;
};
