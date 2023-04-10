import {WpChannel} from '../channel/WpChannel';
import type {WpModule} from './WpModule';
import type {TransferList} from '../types';
import type {WorkerCh, WorkerMethod, WorkerMethodsMap} from '../worker/types';
import type {WpWorker} from '../WpWorker';

/** Module pinned to a single worker. */
export class WpModulePinned<Methods extends WorkerMethodsMap> {
  constructor(protected readonly module: WpModule, protected readonly worker: WpWorker) {}

  public ch<K extends keyof Methods>(
    method: K,
    req: Methods[K] extends WorkerMethod<infer Request, any> ? Request : never,
    transferList?: TransferList | undefined,
  ) {
    type Res = Methods[K] extends WorkerMethod<any, infer R> ? R : never;
    type Chan = Methods[K] extends WorkerCh<any, infer I, infer O, any> ? [I, O] : never;
    const id = this.module.methodId(method as string);
    const channel = new WpChannel<Res, Chan[0], Chan[1]>(id);
    this.worker.attachChannel(req, transferList, channel as WpChannel);
    return channel;
  }
}
