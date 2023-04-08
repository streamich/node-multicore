import {AbstractWorkerModule} from './AbstractWorkerModule';
import type {WorkerMethodsMap, WorkerModule} from "./types";

export class WorkerModuleFunction extends AbstractWorkerModule implements WorkerModule {
  public methods: WorkerMethodsMap = {
    default: () => void 0,
  };

  constructor(public readonly id: number, public readonly text: string) {
    super();
  }

  public async load(): Promise<void> {
    throw new Error('INVALID_MODULE');
  }

  public async unload(): Promise<void> {
    this.methods = {
      default: () => void 0,
    };
  }
}
