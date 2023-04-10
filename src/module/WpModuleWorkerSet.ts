import {Defer, mutex} from 'thingies';
import type {WorkerPool} from '../WorkerPool';
import type {WpModule} from './WpModule';
import type {WpWorker} from '../WpWorker';

/**
 * Tracks worker thread set in which current modules has been loaded. This
 * allows for a module to be loaded in a subset of the worker threads in the
 * pool. Also, it is lazy, it starts with no workers, and only adds workers
 * when they are needed.
 */
export class WpModuleWorkerSet {
  protected readonly workers1: Set<WpWorker> = new Set();
  protected readonly workers2: WpWorker[] = [];
  protected readonly newWorkers: Set<Promise<WpWorker>> = new Set();
  protected nextWorker: number = 0;

  constructor(protected readonly pool: WorkerPool, protected readonly module: WpModule) {}

  public get workers(): WpWorker[] {
    return this.workers2;
  }

  public get pendingWorkers(): Promise<WpWorker>[] {
    return [...this.newWorkers];
  }

  public size(): number {
    return this.workers2.length;
  }

  /** Makes sure the module is initialized at least in one worker. */
  public async init(): Promise<void> {
    if (this.size() > 0) return;
    await this.grow();
  }

  protected pickNewWorkerFromPool(): WpWorker | undefined {
    const {workers1} = this;
    const allWorkers = this.pool.randomWorkers();
    const length = allWorkers.length;
    for (let i = 0; i < length; i++) {
      const worker = allWorkers[i];
      if (!workers1.has(worker)) return worker;
    }
    return;
  }

  @mutex
  protected async addWorkerFromPool(): Promise<WpWorker> {
    const worker = this.pickNewWorkerFromPool() || (await this.pool.worker$());
    await this.addWorker(worker);
    return worker;
  }

  protected async addWorker(worker: WpWorker): Promise<void> {
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

  public removeWorker(worker: WpWorker): void {
    const {workers1, workers2} = this;
    workers1.delete(worker);
    const index = workers2.indexOf(worker);
    if (index >= 0) workers2.splice(index, 1);
  }

  public worker(): WpWorker | undefined {
    const {workers2} = this;
    const length = workers2.length;
    if (this.nextWorker >= length) this.nextWorker = 0;
    const worker = workers2[this.nextWorker];
    if (!worker) return;
    this.nextWorker = (this.nextWorker + 1) % length;
    return worker;
  }

  public async worker$(): Promise<WpWorker> {
    return this.worker() || this.addWorkerFromPool();
  }

  public maybeGrow(worker: WpWorker, methodId: number): void {
    const activeWorkerTasks = worker.tasks();
    const workerIsTooBusy = activeWorkerTasks > 2;
    const stillWorkingOnTheSameTask = activeWorkerTasks > 0 && worker.lastMethodId === methodId;
    if (!workerIsTooBusy && !stillWorkingOnTheSameTask) return;
    this.grow().catch(() => {});
  }

  @mutex
  public async grow(): Promise<WpWorker | undefined> {
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
