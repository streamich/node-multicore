import type {WorkerPoolModule} from './WorkerPoolModule';
import type {TransferList} from './types';
import type {WorkerCh, WorkerFn, WorkerMethod, WorkerMethodsMap} from './worker/types';
import type {WorkerPoolChannel} from './WorkerPoolChannel';

export class WorkerPoolModuleTyped<Methods extends WorkerMethodsMap> {
  constructor(protected readonly module: WorkerPoolModule) {}

  public ch<K extends keyof Methods>(
    method: K,
    req: Methods[K] extends WorkerMethod<infer Request, any> ? Request : never,
    transferList?: TransferList | undefined,
  ) {
    type Res = Methods[K] extends WorkerMethod<any, infer R> ? R : never;
    type Chan = Methods[K] extends WorkerCh<any, infer I, infer O, any> ? [I, O] : never;
    return this.module.ch<Res, Chan[0], Chan[1]>(method as string, req, transferList);
  }

  public async exec<K extends keyof Methods>(
    method: K,
    req: Methods[K] extends WorkerMethod<infer Request, any> ? Request : never,
    transferList?: TransferList | undefined,
  ) {
    type Res = Methods[K] extends WorkerMethod<any, infer R> ? R : never;
    return this.module.exec<Res>(method as string, req, transferList);
  }

  public fn<K extends keyof Methods>(method: K) {
    type Res = Methods[K] extends WorkerMethod<any, infer R> ? R : never;
    type Chan = Methods[K] extends WorkerCh<any, infer I, infer O, any> ? [I, O] : never;
    return this.module.fn<Res, Chan[0], Chan[1]>(method as string);
  }

  public async init(): Promise<this> {
    await this.module.init();
    return this;
  }

  public api(): WorkerMethods<Methods> {
    if (!this.module.isInitialized()) throw new Error('Module not initialized, run init() first.');
    const api: Partial<WorkerMethods<Methods>> = {};
    for (const method of this.module.methods()) (api as any)[method] = this.fn(method);
    return api as WorkerMethods<Methods>;
  }
}

type Fn<Req, In, Out, Res> = (req: Req, transferList?: TransferList) => WorkerPoolChannel<Res, In, Out>;

type WorkerMethods<T> = {
  [K in keyof T]: T[K] extends WorkerFn<infer Req, infer Res>
    ? Fn<Req, void, void, Res>
    : T[K] extends WorkerCh<infer Req, infer Res, infer Out, infer In>
    ? Fn<Req, In, Out, Res>
    : Fn<void, void, void, T[K]>;
};
