import type {TransferList} from './types';

export class WpChannel<Res = unknown, In = unknown, Out = unknown> {
  public ondata?: (data: In) => void;
  public onsend?: (data: unknown, transferList?: TransferList) => void;

  public readonly resolve!: (data: Res) => void;
  public readonly reject!: (error: any) => void;
  public readonly result: Promise<Res> = new Promise<Res>((resolve, reject) => {
    (this as any).resolve = resolve;
    (this as any).reject = reject;
  });

  constructor(public readonly methodId: number) {}

  public onData(data: In): void {
    if (this.ondata) this.ondata(data);
  }

  public send(data: Out, transferList?: TransferList): void {
    const send = this.onsend;
    if (send) send(data, transferList);
  }
}
