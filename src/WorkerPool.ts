import {cpus} from 'os';
import {Defer, mutex} from 'thingies';
import {WpModule} from './WpModule';
import {WpWorker} from './WpWorker';
import {WpModuleDefinitionStatic} from './WpModuleDefinitionStatic';
import {sha256} from './util/sha';
import {WpModuleDefinitionFunc} from './WpModuleDefinitionFunc';
import {WorkerCh, WorkerFn} from './worker/types';
import type {WorkerOptions} from 'worker_threads';

export interface WorkerPoolOptions {
  /** Minimum number of worker threads to maintain. */
  min: number;
  /** Maximum number of worker threads. */
  max: number;
  /** Passed to worker threads, whether to close any unclosed file descriptors, defaults to false. */
  trackUnmanagedFds: boolean;
  /**
   * Worker pool name. Passed to worker threads, name used for debugging
   * purposes. Defaults to "multicore".
   */
  name: string;
  /** Resource limits to set on each worker. */
  resourceLimits?: WorkerOptions['resourceLimits'];
  /** Environment variables to set in each worker. */
  env?: WorkerOptions['env'];
}

export class WorkerPool {
  public readonly options: Readonly<WorkerPoolOptions>;
  protected nextWorker: number = 0;
  protected readonly workers: WpWorker[] = [];
  protected readonly newWorkers: Set<Promise<WpWorker>> = new Set();
  public modules: Map<string, WpModule> = new Map();

  constructor(options: Partial<WorkerPoolOptions> = {}) {
    this.options = {
      min: +(process.env.MC_MIN_THREAD_POOL_SIZE || '') || 0,
      max: +(process.env.MC_MAX_THREAD_POOL_SIZE || '') || Math.max(1, Math.min(cpus().length - 1, 15)),
      trackUnmanagedFds: false,
      name: 'multicore',
      ...options,
    };
    if (this.options.min > this.options.max) throw new Error('MIN > MAX');
  }

  public async init(): Promise<void> {
    if (this.options.min > 0) {
      await Promise.all(Array.from({length: this.options.min}, () => this.addWorker()));
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
  public async addWorker(): Promise<WpWorker> {
    const worker = new WpWorker({
      pool: this,
      onExit: () => {
        const index = this.workers.indexOf(worker);
        if (index >= 0) this.workers.splice(index, 1);
        for (const module of this.modules.values()) module.removeWorker(worker);
        if (this.size() < this.options.min) this.grow().catch(() => {});
      },
    });
    const worker$ = new Defer<WpWorker>();
    this.newWorkers.add(worker$.promise);
    try {
      await worker.init();
      this.workers.push(worker);
      worker$.resolve(worker);
    } catch (error) {
      worker$.reject(error);
      throw error;
    } finally {
      this.newWorkers.delete(worker$.promise);
    }
    return worker;
  }

  @mutex
  public async grow(): Promise<WpWorker | undefined> {
    if (this.newWorkers.size > 0) return await this.newWorkers.values().next().value;
    if (this.size() < this.options.max) return await this.addWorker();
    return undefined;
  }

  public module(specifier: string): WpModule {
    const existingModule = this.modules.get(specifier);
    if (existingModule) return existingModule;
    const definition = new WpModuleDefinitionStatic(specifier);
    const module = new WpModule(this, definition);
    this.modules.set(specifier, module);
    return module;
  }

  public fun(fn: WorkerFn<any, any> | WorkerCh<any, any, any, any>): WpModule {
    const text = fn.toString();
    const specifier = sha256(text);
    const existingModule = this.modules.get(specifier);
    if (existingModule) return existingModule;
    const definition = new WpModuleDefinitionFunc(specifier, text);
    const module = new WpModule(this, definition);
    this.modules.set(specifier, module);
    return module;
  }

  /** Pick the next random worker from the pool. */
  public worker(): WpWorker | undefined {
    const worker = this.workers[this.nextWorker];
    if (!worker) return;
    this.nextWorker = (this.nextWorker + 1) % this.workers.length;
    return worker;
  }

  /** Pick the next random worker from the pool. */
  public async worker$(): Promise<WpWorker> {
    return this.worker() || this.newWorkers.values().next().value || this.addWorker();
  }

  /** Returns list of workers in random order. */
  public randomWorkers(): WpWorker[] {
    const workers = this.workers;
    const length = workers.length;
    const randomIndex = Math.round(Math.random() * length);
    return workers.slice(randomIndex).concat(workers.slice(0, randomIndex));
  }

  /**
   * Shutdown all worker threads.
   */
  public async shutdown(): Promise<void> {
    await Promise.allSettled([
      ...this.workers.map((worker) => worker.shutdown()),
      ...[...this.newWorkers].map((promise) => promise.then((worker) => worker.shutdown())),
    ]);
  }
}
