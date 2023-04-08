import type {ModuleTableEntry, WorkerCh, WorkerFn, WorkerMethodsMap, WorkerModule} from "./types";

export abstract class AbstractWorkerModule implements WorkerModule {
  public abstract id: number;
  public abstract load(): Promise<void>;
  public abstract unload(): Promise<void>;

  public methods: WorkerMethodsMap = {};

  public table(): ModuleTableEntry[] {
    const table: ModuleTableEntry[] = [];
    const sorted = Object.keys(this.methods).sort();
    const moduleWord = this.id << 16;
    for (let i = 0; i < sorted.length; i++) {
      const key = sorted[i];
      const method = this.methods[key];
      const fn: WorkerFn | WorkerCh =
        typeof method === 'function'
        ? method as WorkerFn | WorkerCh
        : method instanceof Promise
          ? async (...args: any[]) => {
            const awaited = await method;
            return typeof awaited === 'function' ? awaited(...args) : awaited;
          }
          : () => method;
      table.push([key, moduleWord | i, fn])
    }
    return table;
  }
}
