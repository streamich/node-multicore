import {go} from 'thingies';
import {WpModuleTyped} from './WpModuleTyped';
import {WpModuleWorkerSet} from './WpModuleWorkerSet';
import {WpChannel} from './WpChannel';
import type {WorkerMethodsMap} from './worker/types';
import type {WorkerPool} from './WorkerPool';
import type {WpWorker} from './WpWorker';
import type {TransferList, WpModuleDef} from './types';

let id = 0;

/**
 * {@link WpModule} represents a module loaded in a {@link WorkerPool}.
 * Each module is loaded in all worker threads. Then any method exported on the
 * `.methods` export of that module can be called in any thread.
 */
export class WpModule {
  public readonly id: number = id++;
  protected readonly toId: Map<string, number> = new Map();
  public readonly workers: WpModuleWorkerSet;

  constructor(protected readonly pool: WorkerPool, public readonly definition: WpModuleDef) {
    this.workers = new WpModuleWorkerSet(pool, this);
  }

  public isInitialized(): boolean {
    return !!this.workers.size();
  }

  public async init(): Promise<this> {
    await this.workers.init();
    return this;
  }

  public async loadInWorker(worker: WpWorker): Promise<void> {
    const methods = await worker.loadModule(this.id, this.definition);
    const moduleWord = this.id << 16;
    for (let i = 0; i < methods.length; i++) this.toId.set(methods[i], moduleWord | i);
  }

  public async unloadInWorker(worker: WpWorker): Promise<void> {
    await worker.unloadModule(this.id);
  }

  public methodId(name: string): number {
    const id = this.toId.get(name);
    if (id === undefined) throw new Error('UNKNOWN_FN');
    return id;
  }

  public methods(): string[] {
    return Array.from(this.toId.keys());
  }

  public ch<Res = unknown, In = unknown, Out = unknown>(
    method: string,
    req: unknown,
    transferList?: TransferList | undefined,
  ): WpChannel<Res, In, Out> {
    const workers = this.workers;
    const worker = workers.worker();
    const channel = new WpChannel<Res, In, Out>(0);
    if (worker) {
      const id = this.methodId(method as string);
      workers.maybeGrow(worker, id);
      channel.methodId = id;
      worker.attachChannel(req, transferList, channel as WpChannel);
    } else {
      go(async () => {
        const worker = await workers.worker$();
        const id = this.methodId(method as string);
        workers.maybeGrow(worker, id);
        channel.methodId = id;
        worker.attachChannel(req, transferList, channel as WpChannel);
      });
    }
    return channel;
  }

  public async exec<R = unknown>(method: string, req: unknown, transferList?: TransferList | undefined): Promise<R> {
    return this.ch<R>(method, req as any, transferList).result;
  }

  public fn<Req = unknown, Res = unknown, In = unknown, Out = unknown>(method: string) {
    const id = this.methodId(method as string);
    return (req: Req, transferList?: TransferList | undefined): WpChannel<Res, In, Out> => {
      const channel = new WpChannel<Res, In, Out>(id);
      const workers = this.workers;
      const worker = workers.worker();
      if (worker) {
        workers.maybeGrow(worker, id);
        worker.attachChannel(req, transferList, channel as WpChannel<unknown, unknown, unknown>);
        return channel;
      }
      go(async () => {
        const worker = await workers.worker$();
        workers.maybeGrow(worker, id);
        worker.attachChannel(req, transferList, channel as WpChannel<unknown, unknown, unknown>);
      });
      return channel;
    };
  }

  public api<T extends Record<string, (...args: any[]) => WpChannel>>(): T {
    const api = {} as T;
    const methodTableIsKnown = !!this.toId.size;
    if (methodTableIsKnown) {
      for (const key of this.toId.keys()) (api as any)[key] = this.fn(key);
      return api;
    }
    const handler: ProxyHandler<T> = {
      get: (target, method: string) => {
        const methodTableIsKnown = !!this.toId.size;
        if (methodTableIsKnown) {
          for (const key of this.toId.keys()) (api as any)[key] = this.fn(key);
          delete handler.get;
        }
        return (req: unknown, transferList: TransferList) => this.ch(method, req, transferList);
      },
    };
    const proxy = new Proxy(api, handler);
    return proxy;
  }

  public typed<Methods extends WorkerMethodsMap>(): WpModuleTyped<Methods> {
    return new WpModuleTyped(this);
  }

  public removeWorker(worker: WpWorker): void {
    this.workers.removeWorker(worker);
  }
}
