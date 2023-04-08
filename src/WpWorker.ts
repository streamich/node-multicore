import {resolve} from 'path';
import {Worker, type WorkerOptions} from 'worker_threads';
import {WpChannel} from './WpChannel';
import type {
  TransferList,
  WpMsgError,
  WpMsgRequest,
  WpMsgResponse,
  WpMsgLoadModule,
  WpMsgChannelData,
  WpModuleDef,
  WpMessage,
} from './types';
import type {WorkerPool} from './WorkerPool';
import {WpModuleDefinitionStatic} from './WpModuleDefinitionStatic';
import {MessageType} from './message/constants';

const fileName = resolve(__dirname, 'worker', 'main');

export interface WorkerPoolWorkerOptions {
  pool: WorkerPool;
  onExit: () => void;
}

export class WpWorker {
  private worker: Worker;
  protected seq: number = 0;
  protected readonly channels: Map<number, WpChannel> = new Map();

  constructor(protected readonly options: WorkerPoolWorkerOptions) {
    const {pool} = options;
    const workerOptions: WorkerOptions & {name: string} = {
      name: pool.options.name,
      env: pool.options.env,
      trackUnmanagedFds: pool.options.trackUnmanagedFds,
      resourceLimits: pool.options.resourceLimits,
    };
    this.worker = new Worker(fileName, workerOptions);
  }

  public tasks(): number {
    return this.channels.size;
  }

  public async init(): Promise<void> {
    const worker = this.worker;
    worker.once('exit', () => {
      worker.removeAllListeners();
      worker.unref();
      this.options.onExit();
    });
    await new Promise<void>((resolve) => worker.once('message', resolve));
    worker.unref();
  }

  /**
   * Load a module in this worker.
   * @param module Module to load.
   */
  public async loadModule(id: number, definition: WpModuleDef): Promise<string[]> {
    const worker = this.worker;
    const msg: WpMsgLoadModule = [MessageType.LoadModule, id,
      definition instanceof WpModuleDefinitionStatic
        ? {type: 'static', specifier: definition.specifier}
        : {type: 'func', text: definition.text},
    ];
    this.send(msg, undefined);
    const methods = await new Promise<string[]>((resolve) => {
      const onmessage = (msg: WpMessage) => {
        if (msg[0] !== MessageType.ModuleLoaded) return;
        const [, responseId, methods] = msg;
        if (responseId !== id) return;
        worker.off('message', onmessage);
        resolve(methods);
      };
      worker.on('message', onmessage);
    });
    if (!this.channels.size) worker.unref();
    return methods;
  }

  public async unloadModule(id: number): Promise<void> {
    throw new Error('Not implemented');
  }

  private onmessage = (msg: WpMessage): void => {
    switch (msg[0]) {
      case MessageType.Response: {
        this.onResponse(msg);
        break;
      }
      case MessageType.ChannelData: {
        this.onChannelData(msg);
        break;
      }
      case MessageType.Error: {
        this.onError(msg);
        break;
      }
    }
  };

  protected onResponse([, seq, data]: WpMsgResponse): void {
    const channels = this.channels;
    const channel = channels.get(seq);
    if (!channel) return;
    channels.delete(seq);
    channel.resolve(data);
    if (!channels.size) {
      this.worker.off('message', this.onmessage);
      this.worker.unref();
    }
  }

  protected onError([, seq, data]: WpMsgError): void {
    const channels = this.channels;
    const channel = channels.get(seq);
    if (!channel) return;
    channels.delete(seq);
    channel.reject(data);
    if (!channels.size) {
      this.worker.off('message', this.onmessage);
      this.worker.unref();
    }
  }

  protected onClose(msg: WpMsgResponse | WpMsgError): void {
    const [seq, data, isError] = msg;
    const channels = this.channels;
    const channel = channels.get(seq);
    if (!channel) return;
    channels.delete(seq);
    if (!channels.size) {
      this.worker.off('message', this.onmessage);
      this.worker.unref();
    }
    if (isError) channel.reject(data);
    else channel.resolve(data);
  }

  protected onChannelData([, seq, data]: WpMsgChannelData): void {
    const channel = this.channels.get(seq);
    if (!channel) return;
    channel.onData(data);
  }

  protected sendRequest(seq: number, id: number, req: unknown, transferList: TransferList | undefined): void {
    const request: WpMsgRequest = [MessageType.Request, seq, id, req];
    this.send(request, transferList);
  }

  public sendChannelData(seq: number, data: unknown, transferList: TransferList | undefined): void {
    const msg: WpMsgChannelData<unknown> = [MessageType.ChannelData, seq, data];
    this.send(msg, transferList);
  }

  protected send(msg: unknown, transferList: TransferList | undefined): void {
    this.worker.postMessage(msg, transferList);
  }

  public lastMethodId: number = 0;

  public attachChannel(req: unknown, transferList: TransferList | undefined, channel: WpChannel): void {
    const id = (this.lastMethodId = channel.methodId);
    const seq = this.seq++;
    const channels = this.channels;
    channel.onsend = (data, transferList) => this.sendChannelData(seq, data, transferList);
    try {
      if (!channels.size) {
        this.worker.on('message', this.onmessage);
        this.worker.ref();
      }
      channels.set(seq, channel);
      this.sendRequest(seq, id, req, transferList);
    } catch (error) {
      channels.delete(seq);
      if (!channels.size) {
        this.worker.off('message', this.onmessage);
        this.worker.unref();
      }
      channel.reject(error);
    }
  }

  public async shutdown(): Promise<void> {
    await this.worker.terminate();
  }
}
