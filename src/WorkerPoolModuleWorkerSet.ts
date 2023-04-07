import {Defer} from 'thingies';
import type {WorkerPool} from './WorkerPool';
import type {WorkerPoolModule} from './WorkerPoolModule';
import {WorkerPoolWorker} from './WorkerPoolWorker';

/**
 * Tracks worker thread set in which current modules has been loaded. This
 * allows for a module to be loaded in a subset of the worker threads in the
 * pool. Also, it is lazy, it starts with no workers, and only adds workers
 * when they are needed.
 */
export class WorkerPoolModuleWorkerSet {
  protected readonly workers1: Set<WorkerPoolWorker> = new Set();
  protected readonly workers2: WorkerPoolWorker[] = [];
  protected readonly newWorkers: Set<Promise<WorkerPoolWorker>> = new Set();
  protected nextWorker: number = 0;

  constructor (protected readonly pool: WorkerPool, protected readonly module: WorkerPoolModule) {}

  public size(): number {
    return this.workers2.length;
  }

  protected pickNewWorkerFromPool(): WorkerPoolWorker | undefined {
    const {workers1} = this;
    const allWorkers = this.pool.randomWorkers();
    const length = allWorkers.length;
    for (let i = 0; i < length; i++) {
      const worker = allWorkers[i];
      if (!workers1.has(worker)) return worker;
    }
    return;
  }

  protected addWorkerFromPool(): Promise<WorkerPoolWorker> {
    if (!this.__addWorkerFromPoolMutex) this.__addWorkerFromPoolMutex = (async () => {
      const worker = this.pickNewWorkerFromPool() || await this.pool.worker$();
      await this.addWorker(worker);
      this.__addWorkerFromPoolMutex = undefined;
      return worker;
    })();
    return this.__addWorkerFromPoolMutex;
  }
  private __addWorkerFromPoolMutex: Promise<WorkerPoolWorker> | undefined;

  protected async addWorker(worker: WorkerPoolWorker): Promise<void> {
    const worker$ = new Defer<typeof worker>();
    this.newWorkers.add(worker$.promise);
    try {
      await this.module.loadInWorker(worker);
      this.workers1.add(worker);
      this.workers2.push(worker);
      worker$.resolve(worker);
    } catch (error) {
      worker$.reject(error);
      throw error;
    } finally {
      this.newWorkers.delete(worker$.promise);
    }
  }

  public worker(): WorkerPoolWorker | undefined {
    const {workers2} = this;
    const length = workers2.length;
    if (this.nextWorker >= length) this.nextWorker = 0;
    const worker = workers2[this.nextWorker];
    if (!worker) return;
    if (worker.dead) {
      this.workers1.delete(worker);
      this.workers2.splice(this.nextWorker, 1);
      return;
    } else {
      this.nextWorker = (this.nextWorker + 1) % length;
      return worker;
    }
  }

  public async worker$(): Promise<WorkerPoolWorker> {
    const worker = this.worker();
    if (worker) return worker;
    return await this.addWorkerFromPool();
  }

  public maybeGrow(worker: WorkerPoolWorker, methodId: number): void {
    const activeWorkerTasks = worker.tasks();
    const workerIsTooBusy = activeWorkerTasks > 2;
    const stillWorkingOnTheSameTask = activeWorkerTasks > 0 && worker.lastMethodId === methodId;
    if (!workerIsTooBusy && !stillWorkingOnTheSameTask) return;
    this.grow().catch(() => {});
  }

  public async grow(): Promise<WorkerPoolWorker | undefined> {
    const poolHasMoreWorkersToDraw = this.pool.size() > this.size();
    if (poolHasMoreWorkersToDraw) return this.addWorkerFromPool();
    else {
      const worker = await this.pool.grow();
      if (!worker) return;
      await this.addWorker(worker);
      return worker;
    }
  }
}
