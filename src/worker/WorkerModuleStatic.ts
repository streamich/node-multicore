import {pathToFileURL} from 'url';
import {AbstractWorkerModule} from './AbstractWorkerModule';
import type {WorkerMethodsMap, WorkerModule} from "./types";

export class WorkerModuleStatic extends AbstractWorkerModule implements WorkerModule {
  public methods: WorkerMethodsMap = {};

  constructor(public readonly id: number, public readonly specifier: string) {
    super();
  }

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

  public async unload(): Promise<void> {
    this.methods = {};
    const specifier = this.specifier;
    const name = require.resolve(specifier);
    delete require.cache[name];
  }
}
