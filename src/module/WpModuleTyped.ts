import {WpModulePinned} from './WpModulePinned';
import type {WpModule} from './WpModule';
import type {TransferList} from '../types';
import type {WorkerCh, WorkerFn, WorkerMethod, WorkerMethodsMap} from '../worker/types';
import type {WpChannel} from '../channel/WpChannel';

export class WpModuleTyped<Methods extends WorkerMethodsMap> {
  constructor(protected readonly module: WpModule) {}

  public readonly init = async (): Promise<this> => {
    await this.module.init();
    return this;
  };

  public readonly ch = <K extends keyof Methods>(
    method: K,
    req: Methods[K] extends WorkerMethod<infer Request, any> ? Request : never,
    transferList?: TransferList | undefined,
  ) => {
    type Res = Methods[K] extends WorkerMethod<any, infer R> ? R : never;
    type Chan = Methods[K] extends WorkerCh<any, infer I, infer O, any> ? [I, O] : never;
    return this.module.ch<Res, Chan[0], Chan[1]>(method as string, req, transferList);
  };

  public readonly exec = <K extends keyof Methods>(
    method: K,
    req: Methods[K] extends WorkerMethod<infer Request, any> ? Request : never,
    transferList?: TransferList | undefined,
  ) => {
    type Res = Methods[K] extends WorkerMethod<any, infer R> ? R : never;
    return this.module.exec<Res>(method as string, req, transferList);
  };

  public readonly fn = <K extends keyof Methods>(method: K) => {
    type Req = Methods[K] extends WorkerMethod<infer Request, any> ? Request : never;
    type Res = Methods[K] extends WorkerMethod<any, infer R> ? R : never;
    type Chan = Methods[K] extends WorkerCh<any, infer I, infer O, any> ? [I, O] : never;
    return this.module.fn<Req, Res, Chan[0], Chan[1]>(method as string);
  };

  public api(): WorkerApi<Methods> {
    return this.module.api() as WorkerApi<Methods>;
  }

  /** Returns API of this module, which is pinned to one worker. */
  public pinned<Methods extends WorkerMethodsMap>(): WpModulePinned<Methods> {
    return this.module.pinned<Methods>();
  }
}

type Fn<Req, In, Out, Res> = (req: Req, transferList?: TransferList) => WpChannel<Res, In, Out>;

type WorkerApi<T> = {
  [K in keyof T]: T[K] extends WorkerFn<infer Req, infer Res>
    ? Fn<Req, void, void, Res>
    : T[K] extends WorkerCh<infer Req, infer Res, infer Out, infer In>
    ? Fn<Req, In, Out, Res>
    : Fn<void, void, void, T[K]>;
};
