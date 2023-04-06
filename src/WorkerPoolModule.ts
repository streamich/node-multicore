import {WorkerPoolModuleTyped} from './WorkerPoolModuleTyped';
import {WorkerPoolModuleWorkerSet} from './WorkerPoolModuleWorkerSet';
import type {WorkerMethodsMap} from './worker/types';
import type {WorkerPool} from './WorkerPool';
import type {WorkerPoolWorker} from './WorkerPoolWorker';
import type {WorkerPoolChannel} from './WorkerPoolChannel';
import type {TransferList} from './types';

let id = 0;

/**
 * {@link WorkerPoolModule} represents a module loaded in a {@link WorkerPool}.
 * Each module is loaded in all worker threads. Then any method exported on the
 * `.methods` export of that module can be called in any thread.
 */
export class WorkerPoolModule {
  public readonly id: number = id++;
  protected readonly toId: Map<string, number> = new Map();
  protected readonly workers: WorkerPoolModuleWorkerSet;

  constructor(protected readonly pool: WorkerPool, public readonly specifier: string) {
    this.workers = new WorkerPoolModuleWorkerSet(pool, this);
  }

  public async loadInWorker(worker: WorkerPoolWorker): Promise<void> {
    const methods = await worker.loadModule(this.id, this.specifier);
    const moduleWord = this.id << 16;
    for (let i = 0; i < methods.length; i++)
      this.toId.set(methods[i], moduleWord | i);
  }

  public async unloadInWorker(worker: WorkerPoolWorker): Promise<void> {
    if (worker.dead) return;
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

  public async ch<Res = unknown, In = unknown, Out = unknown>(
    method: string,
    req: unknown,
    transferList?: TransferList | undefined,
  ): Promise<WorkerPoolChannel<Res, In, Out>> {
    const workers = this.workers;
    const worker = workers.worker() || await workers.worker$();
    const id = this.methodId(method as string);
    workers.maybeGrow(worker, id);
    const channel = worker.ch(id, req, transferList) as WorkerPoolChannel<Res, In, Out>;
    return channel;
  }

  public async exec<R = unknown>(
    method: string,
    req: unknown,
    transferList?: TransferList | undefined,
  ): Promise<R> {
    return (await this.ch<R>(method, req as any, transferList)).promise;
  }

  public async fn<Res = unknown, In = unknown, Out = unknown>(method: string) {
    const id = this.methodId(method as string);
    return async (req: unknown, transferList?: TransferList | undefined): Promise<WorkerPoolChannel<Res, In, Out>> => {
      const workers = this.workers;
      const worker = workers.worker() || await workers.worker$();
      workers.maybeGrow(worker, id);
      const channel = worker.ch(id, req, transferList) as WorkerPoolChannel<Res, In, Out>;
      return channel;
    };
  }

  public typed<Methods extends WorkerMethodsMap>(): WorkerPoolModuleTyped<Methods> {
    return new WorkerPoolModuleTyped(this);
  }
}
