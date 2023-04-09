import {decoder} from "./codec";
import {HeaderIndex, MemoryPortSizing} from "./constants";

export class MemoryPortSlot {
  public readonly header: Int32Array;
  public readonly body: Uint8Array;
  public locked: boolean = false;

  constructor(
    public index: number,
    sab: SharedArrayBuffer,
    offset: number,
    byteLength: number
  ) {
    this.header = new Int32Array(sab, offset, MemoryPortSizing.HeaderSize >> 2);
    this.header.fill(0);
    this.body = new Uint8Array(sab, offset + this.header.byteLength, byteLength - this.header.byteLength);
  }

  public send(): void {
    Atomics.notify(this.header, HeaderIndex.Send);
    this.listenForAck();
  }
  
  protected ack(): void {
    Atomics.notify(this.header, HeaderIndex.Ack);
  }

  public async receive(): Promise<unknown> {
    const unlock = Atomics.waitAsync(this.header, HeaderIndex.Send, 0);
    if (!unlock.async) {
      this.locked = false;
      throw new Error('BROKEN_RECEIVE');
    }
    await unlock.value;
    const data = decoder.decode(this.body);
    this.ack();
    return data;
  }

  private listenForAckPromise: Promise<unknown> | undefined;
  protected listenForAck(): void {
    if (this.listenForAckPromise) return;
    const unlock = Atomics.waitAsync(this.header, HeaderIndex.Ack, 0);
    if (!unlock.async) {
      this.locked = false;
      return;
    }
    this.listenForAckPromise = unlock.value;
    this.listenForAckPromise.then(() => {
      this.locked = false;
      this.listenForAckPromise = undefined;
      this.listenForAck();
    });
  }
}
