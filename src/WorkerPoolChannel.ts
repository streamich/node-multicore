import {Defer} from './util/Defer';
import type {WorkerPoolWorker} from './WorkerPoolWorker';
import type {TransferList} from './types';

export class WorkerPoolChannel<Res = unknown, In = unknown, Out = unknown> extends Defer<Res> {
  protected closed: boolean = false;

  public ondata: undefined | ((data: In) => void);

  constructor(public readonly seq: number, public readonly worker: WorkerPoolWorker) {
    super();
  }

  public onResponse(value: Res): void {
    this.closed = true;
    this.resolve(value);
  }

  public onError(error: unknown): void {
    this.closed = true;
    this.reject(error);
  }

  public onData(data: In): void {
    if (this.ondata) this.ondata(data);
  }

  public send(data: Out, transferList?: TransferList): void {
    if (this.closed) throw new Error('CHANNEL_CLOSED');
    this.worker.sendChannelData(this.seq, data, transferList);
  }

  public isClosed(): boolean {
    return this.closed;
  }
}
