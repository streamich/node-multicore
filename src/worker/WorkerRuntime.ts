import {WorkerResponse} from './WorkerResponse';
import type {MessagePort} from 'worker_threads';
import type {
  TransferList,
  WPMsgWorkerReady,
  WpMessage,
  WpMsgRequest,
  WpMsgResponse,
  WpMsgLoad,
  WpMsgLoaded,
  WpMsgError,
  WpMsgChannel,
  WpSend,
  WpRecv,
} from '../types';
import type {WorkerFn, WorkerCh, WorkerModule} from './types';
import {WorkerModuleStatic} from './WorkerModuleStatic';
import {WorkerModuleFunction} from './WorkerModuleFunction';

export class WorkerRuntime {
  protected readonly methods: Map<number, WorkerFn | WorkerCh> = new Map();
  protected readonly chs: Map<number, (data: unknown) => void> = new Map();
  protected readonly modules: Map<number, WorkerModule> = new Map();

  private readonly onmessage = (msg: WpMessage) => {
    if (Array.isArray(msg)) {
      if (Array.isArray(msg[0])) this.onChannel(msg as WpMsgChannel);
      else this.onRequest(msg as WpMsgRequest);
    } else if (msg && typeof msg === 'object') {
      switch (msg.type) {
        case 'load':
          this.onLoad(msg).catch(() => {});
      }
    }
  };

  constructor(protected readonly port: MessagePort) {
    this.port.on('message', this.onmessage);
  }

  protected onChannel(msg: WpMsgChannel): void {
    const [[seq], data] = msg;
    const callback = this.chs.get(seq);
    if (callback) callback(data);
  }

  protected onRequest([seq, method, data]: WpMsgRequest): void {
    const fn = this.methods.get(method);
    if (!fn) return;
    if (fn.length === 1) this.fn(seq, fn as WorkerFn, data);
    else this.ch(seq, fn, data);
  }

  protected fn(seq: number, fn: WorkerFn, data: unknown): void {
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
      } else {
        this.sendResponse(seq, result);
      }
    } catch (error) {
      this.sendError(seq, error);
    }
  }

  protected async ch(seq: number, ch: WorkerCh, data: unknown): Promise<void> {
    let closed = false;
    try {
      const send: WpSend<unknown> = (data: unknown | WorkerResponse<unknown>) => {
        if (closed) throw new Error('CH_CLOSED');
        let transferList: TransferList | undefined;
        if (data instanceof WorkerResponse) {
          transferList = data.transferList;
          data = data.data;
        }
        const msg: WpMsgChannel = [[seq], data];
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
  protected async onLoad({id, def}: WpMsgLoad) {
    const module = def.type === 'static'
      ? new WorkerModuleStatic(id, def.specifier)
      : new WorkerModuleFunction(id, def.text);
    await module.load();
    const table = module.table();
    for (const [, id, fn] of table) this.methods.set(id, fn);
    const response: WpMsgLoaded = {
      type: 'loaded',
      id,
      methods: table.map(([method]) => method),
    };
    this.port.postMessage(response);
  }

  protected sendResponse<Response>(seq: number, response: Response | WorkerResponse<Response>): void {
    let transferList: TransferList | undefined;
    if (response instanceof WorkerResponse) {
      transferList = response.transferList;
      response = response.data;
    }
    try {
      const msg: WpMsgResponse = [seq, response];
      this.port.postMessage(msg, transferList);
    } catch (error) {
      this.sendError(seq, error);
    }
  }

  protected sendError(seq: number, error: unknown): void {
    try {
      const response: WpMsgError = [seq, error, true];
      this.port.postMessage(response);
    } catch {
      const response: WpMsgError = [seq, 'PORT', true];
      this.port.postMessage(response);
    }
  }

  /** Notify main thread that this worker thead has loaded. */
  public sendReady(): void {
    const msg: WPMsgWorkerReady = {type: 'ready'};
    this.port.postMessage(msg);
  }
}
