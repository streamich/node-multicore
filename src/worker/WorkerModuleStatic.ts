import {pathToFileURL} from 'url';
import type {ModuleTableEntry, WorkerCh, WorkerFn, WorkerMethodsMap, WorkerModule} from "./types";

export class WorkerModuleStatic implements WorkerModule {
  public methods: WorkerMethodsMap = {};

  constructor(public readonly id: number, public readonly specifier: string) {}

  public async load(): Promise<void> {
    const specifier = this.specifier;
    try {
      const module = await import(specifier);
      if (module && typeof module === 'object') {
        this.methods = module as WorkerMethodsMap;
        return;
      }
    } catch {}
    const url = pathToFileURL(specifier).href;
    const loader = new Function('url', 'return import(url)');
    const module = await loader(url);
    if (module && typeof module === 'object') {
      this.methods = module as WorkerMethodsMap;
      return;
    }
    throw new Error('INVALID_MODULE');
  }

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

  public async unload(): Promise<void> {
    this.methods = {};
    const specifier = this.specifier;
    const name = require.resolve(specifier);
    delete require.cache[name];
  }
}
