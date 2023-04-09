import {isMainThread, parentPort, workerData} from 'worker_threads';
import {WorkerRuntime} from './WorkerRuntime';
import {MemoryChannel} from '../memory/MemoryChannel';
import {MemoryPort} from '../memory/MemoryPort';
import type {WorkerData} from '../types';

if (isMainThread) throw new Error('EXPECTED_WORKER_THREAD');

const wd = workerData as WorkerData;
const incoming = new MemoryPort(wd.memory.outgoingSlots, wd.memory.outgoing);
const outgoing = new MemoryPort(wd.memory.incomingSlots, wd.memory.incoming);
const memory = new MemoryChannel(incoming, outgoing);
const runtime = new WorkerRuntime(parentPort!, memory);

runtime.sendReady();
