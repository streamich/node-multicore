import {WorkerPoolModule} from './WorkerPoolModule';
import {WorkerPoolWorker} from './WorkerPoolWorker';

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
    const worker = new WorkerPoolWorker();
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
   * @param id A unique ID of the module.
   * @param file Path to the worker file.
   */
  public async addModule(id: string, file: string): Promise<WorkerPoolModule> {
    if (this.modules.has(id)) throw new Error(`Duplicate [module = ${id}].`);
    const module = new WorkerPoolModule(this, id, file);
    await Promise.all(this.workers.map((worker) => worker.initModule(module)));
    this.modules.set(id, module);
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
    await Promise.all(this.workers.map(worker => worker.shutdown()))
  }
}
