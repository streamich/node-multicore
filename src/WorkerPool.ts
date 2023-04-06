import {Defer} from 'thingies';
import {WorkerPoolModule} from './WorkerPoolModule';
import {WorkerPoolWorker} from './WorkerPoolWorker';

export interface WorkerPoolOptions {
  /** Minimum number of worker threads to maintain. */
  min: number;
  /** Maximum number of worker threads. */
  max: number;
  /** Passed to worker threads, whether to close any unclosed file descriptors, defaults to false. */
  trackUnmanagedFds: boolean;
  /** Worker pool name. Passed to worker threads, name used for debugging purposes. Defualts ot "multicore".*/
  name: string;
}

export class WorkerPool {
  public readonly options: Readonly<WorkerPoolOptions>;
  protected nextWorker: number = 0;
  protected readonly workers: WorkerPoolWorker[] = [];
  protected readonly newWorkers: Set<Promise<WorkerPoolWorker>> = new Set();
  public modules: Map<string, WorkerPoolModule> = new Map();

  constructor(options: Partial<WorkerPoolOptions> = {}) {
    this.options = {
      min: 1,
      max: +(process.env.MC_MAX_THREADPOOL_SIZE || '') || 4,
      trackUnmanagedFds: false,
      name: 'multicore',
      ...options,
    };
  }

  public async init(): Promise<void> {
    if (this.options.min > 0) {
      await Promise.all(
        Array.from({length: this.options.min}, () => this.addWorker()),
      );
    }
  }

  /** Size of thread pool. */
  public size(): number {
    return this.workers.length;
  }

  /** Number of active tasks in flight. */
  public tasks(): number {
    let sum = 0;
    for (const worker of this.workers) sum += worker.tasks();
    return sum;
  }

  /**
   * Spin up a new worker thread in this {@link WorkerPool}.
   */
  public async addWorker(): Promise<void> {
    const worker = new WorkerPoolWorker({
      pool: this,
      onExit: () => {
        const index = this.workers.indexOf(worker);
        if (index >= 0) this.workers.splice(index, 1);
      },
    });
    const worker$ = new Defer<WorkerPoolWorker>();
    this.newWorkers.add(worker$.promise);
    try {
      await worker.init();
      const modules = Array.from(this.modules.values());
      for (const module of modules) await worker.loadModule(module);
      this.workers.push(worker);
      worker$.resolve(worker);
    } catch (error) {
      worker$.reject(error);
      throw error;
    } finally {
      this.newWorkers.delete(worker$.promise);
    }
  }

  /**
   * Load a module in all worker threads.
   *
   * @param specifier Path to the worker module file.
   */
  public async addModule(specifier: string): Promise<WorkerPoolModule> {
    const existingModule = this.modules.get(specifier);
    if (existingModule) return existingModule;
    const module = new WorkerPoolModule(this, specifier);
    this.modules.set(specifier, module);
    // TODO: Remove this loading, and load the module on demand. Make this method synchronous.
    await Promise.all(this.workers.map((worker) => worker.loadModule(module)));
    return module;
  }

  /**
   * Pick the next random worker from the pool.
   *
   * @returns A worker pool worker.
   */
  public worker(): WorkerPoolWorker {
    const worker = this.workers[this.nextWorker];
    this.nextWorker = (this.nextWorker + 1) % this.workers.length;
    return worker;
  }

  /**
   * Shutdown all worker threads.
   */
  public async shutdown(): Promise<void> {
    await Promise.allSettled([
      ...this.workers.map((worker) => worker.shutdown()),
      ...[...this.newWorkers].map(promise => promise.then(worker => worker.shutdown())),
    ]);
  }
}
