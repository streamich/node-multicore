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

/**
 * {@link WorkerPool} represents a pool of worker threads.
 *
 * ```
 * const pool = new WorkerPool();
 * ```
 *
 * By default it starts with no threads running. You must add at least one
 * thread before you can use the pool.
 *
 * ```
 * await pool.addWorker(1);
 * ```
 *
 * Next you need to load a module. This is done by calling
 * {@link WorkerPool#addModule} method. The module is loaded in all worker threads.
 *
 * ```
 * await pool.addModule('my-module', './my-module.js');
 * await pool.addModule('my-module-2', './my-module-2.js');
 * ```
 *
 * You can add more threads and more modules at any time. But you must not
 * load them in parallel, i.e. you must not call {@link WorkerPool#addModule}
 * and {@link WorkerPool#addWorkers} at the same time.
 *
 * Currently, threads and modules cannot be removed from the thread pool. See
 * `src/demo/util/worker-pool/demo.ts` for an example.
 */
export class WorkerPool {
  protected nextWorker: number = 0;
  protected readonly workers: WorkerPoolWorker[] = [];
  public modules: Map<string, WorkerPoolModule> = new Map();
  public readonly options: Readonly<WorkerPoolOptions>;

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
    if (this.options.min > 0)
      await this.addWorkers(this.options.min);
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
    await worker.init();
    const modules = Array.from(this.modules.values());
    for (const module of modules) await worker.initModule(module);
    this.workers.push(worker);
  }

  /**
   * Spins up {@link count} number of workers in parallel. Resolves the promise
   * when all workers are ready.
   *
   * @param count Number of workers to spin up.
   */
  public async addWorkers(count: number): Promise<void> {
    const promises: Promise<void>[] = [];
    for (let i = 0; i < count; i++) promises.push(this.addWorker());
    await Promise.all(promises);
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
    await Promise.all(this.workers.map((worker) => worker.initModule(module)));
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
    await Promise.all(this.workers.map((worker) => worker.shutdown()));
  }
}
