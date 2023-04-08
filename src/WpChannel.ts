import {MessageType} from './message/constants';
import type {TransferList, WpMsgRequest} from './types';

export class WpChannel<Res = unknown, In = unknown, Out = unknown> {
  public ondata?: (data: In) => void = undefined;
  public onsend?: (data: unknown, transferList?: TransferList) => void = undefined;
  public request: WpMsgRequest = [MessageType.Request, 0, 0, null];

  public readonly resolve!: (data: Res) => void;
  public readonly reject!: (error: any) => void;
  public readonly result: Promise<Res> = new Promise<Res>((resolve, reject) => {
    (this as any).resolve = resolve;
    (this as any).reject = reject;
  });

  constructor(public methodId: number) {}

  public onData(data: In): void {
    if (this.ondata) this.ondata(data);
  }

  public send(data: Out, transferList?: TransferList): void {
    const send = this.onsend;
    if (send) send(data, transferList);
  }

  public reset(): void {
    this.methodId = 0;
    this.ondata = undefined;
    this.onsend = undefined;
    (this as any).result = new Promise<Res>((resolve, reject) => {
      (this as any).resolve = resolve;
      (this as any).reject = reject;
    });
  }
}
