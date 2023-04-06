import {WorkerPool} from './WorkerPool';
import {go} from 'thingies';

let pool: WorkerPool | undefined;
let threadsStarted = false;
let threadsPromise: undefined | Promise<void>;

const loadThreads = (): Promise<void> => {
  if (threadsPromise) return threadsPromise;
  const cpuCountLessOne = require('os').cpus().length - 1;
  const maxThreads = +(process.env.MC_MAX_THREAD_POOL_SIZE || '') || 4;
  const threadCount = Math.min(Math.max(cpuCountLessOne, 1), maxThreads);
  if (!pool) pool = new WorkerPool();
  threadsPromise = pool
    .addWorker()
    .then(() => {
      if (threadCount - 1 > 0) {
        go(async () => {
          for (let i = 0; i < threadCount - 1; i++) await pool!.addWorker();
        });
      }
      threadsStarted = true;
    })
    .catch(() => {});
  return threadsPromise;
};

export const getSharedPool = async (): Promise<WorkerPool> => {
  if (!threadsStarted) await loadThreads();
  return pool!;
};
