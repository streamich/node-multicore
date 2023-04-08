import {AbstractWorkerModule} from './AbstractWorkerModule';
import type {WorkerMethodsMap, WorkerModule} from "./types";

export class WorkerModuleFunction extends AbstractWorkerModule implements WorkerModule {
  public methods: WorkerMethodsMap = {};

  constructor(public readonly id: number, public readonly text: string) {
    super();
  }

  public async load(): Promise<void> {
    const fn = eval(`(${this.text})`);
    this.methods = { default: fn };
  }

  public async unload(): Promise<void> {
    this.methods = {};
  }
}
