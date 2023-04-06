import {resolve} from 'path';
import {Worker, type WorkerOptions} from 'worker_threads';
import {WorkerPoolChannel} from './WorkerPoolChannel';
import type {
  TransferList,
  WpMsgError,
  WpMsgRequest,
  WpMsgResponse,
  WpMsgLoad,
  WpMsgLoaded,
  WpMsgChannel,
} from './types';
import type {WorkerPoolModule} from './WorkerPoolModule';
import type {WorkerPool} from './WorkerPool';

const fileName = resolve(__dirname, 'worker', 'main');

export class WorkerPoolWorker {
  private worker: Worker;
  protected seq: number = 0;
  protected readonly channels: Map<number, WorkerPoolChannel> = new Map();
  public dead: boolean = false;

  constructor(protected readonly pool: WorkerPool) {
    const options: WorkerOptions & {name: string} = {
      trackUnmanagedFds: pool.options.trackUnmanagedFds,
      name: pool.options.name,  
    };
    this.worker = new Worker(fileName, options);
  }

  public tasks(): number {
    return this.channels.size;
  }

  public async init(): Promise<void> {
    const worker = this.worker;
    worker.on('exit', () => {
      this.dead = true;
      worker.removeAllListeners();
      worker.unref();
      // TODO: inform the pool
    });
    await new Promise<void>((resolve) => worker.once('message', resolve));
    // TODO: handle "error" and "exit" messages.
    worker.unref();
  }

  /**
   * Load a module in this worker.
   * @param module Module to load.
   */
  public async initModule(module: WorkerPoolModule): Promise<string[]> {
    const worker = this.worker;
    const id = module.id;
    const msg: WpMsgLoad = {
      type: 'load',
      id,
      specifier: module.specifier,
    };
    this.send(msg, undefined);
    const external = await new Promise<string[]>((resolve) => {
      const onmessage = (msg: unknown) => {
        if (msg && typeof msg === 'object' && (msg as WpMsgLoaded).type === 'loaded' && (msg as WpMsgLoaded).id === id) {
          worker.off('message', onmessage);
          module.onLoaded(msg as WpMsgLoaded);
          resolve((msg as WpMsgLoaded).methods);
        }
      };
      worker.on('message', onmessage);
    });
    if (!this.channels.size) worker.unref();
    return external;
  }

  private onmessage = (msg: WpMsgResponse | WpMsgError | WpMsgChannel): void => {
    if (!Array.isArray(msg)) return;
    const [first] = msg;
    if (typeof first === 'number') this.onClose(msg as WpMsgResponse | WpMsgError);
    else this.onChannel(msg as WpMsgChannel);
  };

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
    if (isError) channel.onError(data);
    else channel.onResponse(data);
  }

  protected onChannel(msg: WpMsgChannel): void {
    const [[seq], data] = msg;
    const channel = this.channels.get(seq);
    if (!channel) return;
    channel.onData(data);
  }

  protected sendRequest(seq: number, id: number, req: unknown, transferList: TransferList | undefined): void {
    const request: WpMsgRequest = [seq, id, req];
    this.send(request, transferList);
  }

  public sendChannelData(seq: number, data: unknown, transferList: TransferList | undefined): void {
    const msg: WpMsgChannel<unknown> = [[seq], data];
    this.send(msg, transferList);
  }

  protected send(msg: unknown, transferList: TransferList | undefined): void {
    this.worker.postMessage(msg, transferList);
  }

  public ch(id: number, req: unknown, transferList: TransferList | undefined): WorkerPoolChannel {
    const seq = this.seq++;
    const channel = new WorkerPoolChannel(seq, this);
    const channels = this.channels;
    try {
      if (!channels.size) {
        this.worker.on('message', this.onmessage);
        this.worker.ref();
      }
      channels.set(seq, channel);
      this.sendRequest(seq, id, req, transferList);
      return channel;
    } catch (error) {
      channels.delete(seq);
      if (!channels.size) {
        this.worker.off('message', this.onmessage);
        this.worker.unref();
      }
      channel.onError(error);
      return channel;
    }
  }

  public async shutdown(): Promise<void> {
    await this.worker.terminate();
  }
}
