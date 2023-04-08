import {WorkerResponse} from './WorkerResponse';
import {MessageType} from '../message/constants';
import {WorkerModuleStatic} from './WorkerModuleStatic';
import {WorkerModuleFunction} from './WorkerModuleFunction';
import type {MessagePort} from 'worker_threads';
import type {
  TransferList,
  WPMsgWorkerReady,
  WpMessage,
  WpMsgRequest,
  WpMsgResponse,
  WpMsgLoadModule,
  WpMsgModuleLoaded,
  WpMsgError,
  WpMsgChannelData,
  WpSend,
  WpRecv,
} from '../types';
import type {WorkerFn, WorkerCh, WorkerModule} from './types';

type Wrapper = (seq: number, data: unknown) => unknown;

export class WorkerRuntime {
  protected readonly wrappers: Map<number, Wrapper> = new Map();
  protected readonly chs: Map<number, (data: unknown) => void> = new Map();
  protected readonly modules: Map<number, WorkerModule> = new Map();

  private readonly onmessage = (msg: WpMessage) => {
    switch (msg[0]) {
      case MessageType.Request: {
        this.onRequest(msg);
        break;
      }
      case MessageType.ChannelData: {
        this.onChannel(msg);
        break;
      }
      case MessageType.LoadModule: {
        this.onLoadModule(msg);
        break;
      }
    }
  };

  constructor(protected readonly port: MessagePort) {
    this.port.on('message', this.onmessage);
  }

  protected onRequest([, seq, method, data]: WpMsgRequest): void {
    const wrapper = this.wrappers.get(method);
    if (!wrapper) return;
    wrapper(seq, data);
  }

  protected onChannel([, seq, data]: WpMsgChannelData): void {
    const callback = this.chs.get(seq);
    if (callback) callback(data);
  }

  protected fn(fn: WorkerFn, seq: number, data: unknown): void {
    try {
      const result = fn(data);
      if (result instanceof Promise) {
        result
          .then((value) => {
            this.sendResponse(seq, value);
          })
          .catch((error) => {
            this.sendError(seq, error);
          });
      } else
        this.sendResponse(seq, result);
    } catch (error) {
      this.sendError(seq, error);
    }
  }

  protected async ch(ch: WorkerCh, seq: number, data: unknown): Promise<void> {
    let closed = false;
    try {
      const send: WpSend<unknown> = (data: unknown | WorkerResponse<unknown>) => {
        if (closed) throw new Error('CH_CLOSED');
        let transferList: TransferList | undefined;
        if (data instanceof WorkerResponse) {
          transferList = data.transferList;
          data = data.data;
        }
        const msg: WpMsgChannelData = [MessageType.ChannelData, seq, data];
        this.port.postMessage(msg, transferList);
      };
      const recv: WpRecv<unknown> = (callback) => {
        if (closed) throw new Error('CH_CLOSED');
        this.chs.set(seq, callback);
      };
      const response = await ch(data, send, recv);
      closed = true;
      this.chs.delete(seq);
      this.sendResponse(seq, response);
    } catch (error) {
      closed = true;
      this.chs.delete(seq);
      this.sendError(seq, error);
    }
  }

  /** Load a module in this worker thread. */
  protected async onLoadModule([, id, def]: WpMsgLoadModule) {
    const module = def.type === 'static'
      ? new WorkerModuleStatic(id, def.specifier)
      : new WorkerModuleFunction(id, def.text);
    await module.load();
    const table = module.table();
    for (const [, id, fn] of table) this.wrappers.set(id, fn.length === 1
        ? (seq, data) => this.fn(fn as WorkerFn, seq, data)
        : (seq, data) => this.ch(fn as WorkerCh, seq, data));
    const response: WpMsgModuleLoaded = [MessageType.ModuleLoaded, id, table.map(([method]) => method)];
    this.port.postMessage(response);
  }

  protected sendResponse<Response>(seq: number, response: Response | WorkerResponse<Response>): void {
    let transferList: TransferList | undefined;
    if (response instanceof WorkerResponse) {
      transferList = response.transferList;
      response = response.data;
    }
    const msg: WpMsgResponse = [MessageType.Response, seq, response];
    this.port.postMessage(msg, transferList);
  }

  protected sendError(seq: number, error: unknown): void {
    const response: WpMsgError = [MessageType.Error, seq, error];
    this.port.postMessage(response);
  }

  /** Notify main thread that this worker thead has loaded. */
  public sendReady(): void {
    const msg: WPMsgWorkerReady = [MessageType.WorkerReady];
    this.port.postMessage(msg);
  }
}
