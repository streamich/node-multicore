import {isMainThread, parentPort} from 'worker_threads';
import {WorkerRuntime} from './WorkerRuntime';

if (isMainThread) throw new Error('EXPECTED_WORKER_THREAD');

const runtime = new WorkerRuntime(parentPort!);
runtime.sendReady();
