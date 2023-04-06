import {WorkerPoolModuleTyped} from './WorkerPoolModuleTyped';
import type {WpMsgLoaded} from './types';
import type {WorkerMethodsMap} from './worker/types';
import type {WorkerPool} from './WorkerPool';

let id = 0;

/**
 * {@link WorkerPoolModule} represents a module loaded in a {@link WorkerPool}.
 * Each module is loaded in all worker threads. Then any method exported on the
 * `.methods` export of that module can be called in any thread.
 */
export class WorkerPoolModule {
  public readonly id: number = id++;
  protected readonly toId: Map<string, number> = new Map();

  constructor(protected readonly pool: WorkerPool, public readonly specifier: string) {}

  public onLoaded({list}: WpMsgLoaded): void {
    for (const [id, name] of list) {
      this.toId.set(name, id);
    }
  }

  public methodId(name: string): number {
    const id = this.toId.get(name);
    if (id === undefined) throw new Error('UNKNOWN_FN');
    return id;
  }

  public methods(): string[] {
    return Array.from(this.toId.keys());
  }

  public typed<Methods extends WorkerMethodsMap>(): WorkerPoolModuleTyped<Methods> {
    return new WorkerPoolModuleTyped(this.pool, this);
  }
}
