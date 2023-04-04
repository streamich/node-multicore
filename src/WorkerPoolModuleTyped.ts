import type {WorkerPoolModule} from './WorkerPoolModule';
import type {TransferList} from './types';
import type {WorkerPool} from './WorkerPool';
import type {WorkerPoolWorker} from './WorkerPoolWorker';
import type {WorkerCh, WorkerFn, WorkerMethod, WorkerMethodsMap} from './worker/types';
import type {WorkerPoolChannel} from './WorkerPoolChannel';

export class WorkerPoolModuleTyped<Methods extends WorkerMethodsMap> {
  constructor(protected readonly pool: WorkerPool, protected readonly module: WorkerPoolModule) {}

  public ch<K extends keyof Methods>(
    method: K,
    req: Methods[K] extends WorkerMethod<infer Request, any> ? Request : never,
    transferList?: TransferList | undefined,
    worker: WorkerPoolWorker = this.pool.worker(),
  ) {
    const id = this.module.methodId(method as string);
    const channel = worker.ch(id, req, transferList);
    type Res = Methods[K] extends WorkerMethod<any, infer R> ? R : never;
    type Chan = Methods[K] extends WorkerCh<any, infer I, infer O, any> ? [I, O] : never;
    return channel as WorkerPoolChannel<Res, Chan[0], Chan[1]>;
  }

  public async exec<K extends keyof Methods>(
    method: K,
    req: Methods[K] extends WorkerMethod<infer Request, any> ? Request : never,
    transferList?: TransferList | undefined,
    worker?: WorkerPoolWorker,
  ) {
    return await this.ch(method, req as any, transferList, worker).promise;
  }

  public fn<K extends keyof Methods>(
    method: K,
    worker: WorkerPoolWorker = this.pool.worker(),
  ) {
    const id = this.module.methodId(method as string);
    type Res = Methods[K] extends WorkerMethod<any, infer R> ? R : never;
    type Chan = Methods[K] extends WorkerCh<any, infer I, infer O, any> ? [I, O] : never;
    return (
      req: Methods[K] extends WorkerMethod<infer Request, any> ? Request : never,
      transferList?: TransferList | undefined,
    ) => worker.ch(id, req, transferList) as WorkerPoolChannel<Res, Chan[0], Chan[1]>;
  }

  public api(worker?: WorkerPoolWorker): WorkerMethods<Methods> {
    const api: Partial<WorkerMethods<Methods>> = {};
    for (const method of this.module.methods())
      (api as any)[method] = this.fn(method, worker);
    return api as WorkerMethods<Methods>;
  }
}

type Fn<Req, In, Out, Res> = (req: Req, transferList?: TransferList) =>
  WorkerPoolChannel<Res, In, Out>;

type WorkerMethods<T> = {
  [K in keyof T]: T[K] extends WorkerFn<infer Req, infer Res>
    ? Fn<Req, void, void, Res>
    : T[K] extends WorkerCh<infer Req, infer Res, infer Out, infer In>
      ? Fn<Req, In, Out, Res>
      : Fn<void, void, void, T[K]>;
};
