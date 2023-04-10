import {runInThisContext} from 'vm';
import {AbstractWorkerModule} from './AbstractWorkerModule';
import type {WorkerMethodsMap, WorkerModule} from './types';

export class WorkerModuleCjsText extends AbstractWorkerModule implements WorkerModule {
  public methods: WorkerMethodsMap = {};

  constructor(public readonly id: number, public readonly text: string) {
    super();
  }

  public async load(): Promise<void> {
    const code = `(function (exports, require, module, __filename, __dirname) { ${this.text} })`;
    const fn = runInThisContext(code);
    const module = {exports: {}};
    const exports = module.exports;
    fn(exports, require, module, __filename, __dirname);
    this.methods = module.exports;
  }

  public async unload(): Promise<void> {
    this.methods = {};
  }
}
