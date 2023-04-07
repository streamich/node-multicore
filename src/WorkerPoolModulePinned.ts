import type {WorkerPoolModule} from './WorkerPoolModule';
import type {TransferList} from './types';
import type {WorkerCh, WorkerMethod, WorkerMethodsMap} from './worker/types';
import type {WorkerPoolChannel} from './WorkerPoolChannel';
import type {WorkerPoolWorker} from './WorkerPoolWorker';

/** Module pinned to a single worker. */
export class WorkerPoolModulePinned<Methods extends WorkerMethodsMap> {
  constructor(protected readonly module: WorkerPoolModule, protected readonly worker: WorkerPoolWorker) {}

  public ch<K extends keyof Methods>(
    method: K,
    req: Methods[K] extends WorkerMethod<infer Request, any> ? Request : never,
    transferList?: TransferList | undefined,
  ) {
    type Res = Methods[K] extends WorkerMethod<any, infer R> ? R : never;
    type Chan = Methods[K] extends WorkerCh<any, infer I, infer O, any> ? [I, O] : never;
    const id = this.module.methodId(method as string);
    const channel = this.worker.ch(id, req, transferList) as WorkerPoolChannel<Res, Chan[0], Chan[1]>;
    return channel;
  }
}
