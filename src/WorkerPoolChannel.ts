import {Defer} from './util/Defer';
import type {TransferList} from './types';

export class WorkerPoolChannel<Res = unknown, In = unknown, Out = unknown> extends Defer<Res> {
  protected closed: boolean = false;

  public ondata?: (data: In) => void;
  public onsend?: (data: unknown, transferList?: TransferList) => void;

  constructor(public readonly methodId: number) {
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
    const send = this.onsend;
    if (send) send(data, transferList);
  }

  public isClosed(): boolean {
    return this.closed;
  }
}
