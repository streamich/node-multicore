import {decoder} from "./codec";
import {HeaderIndex, MemoryPortSizing} from "./constants";

export class MemoryPortSlot {
  public readonly header: Int32Array;
  public readonly body: Uint8Array;

  constructor(
    public index: number,
    sab: SharedArrayBuffer,
    offset: number,
    byteLength: number
  ) {
    this.header = new Int32Array(sab, offset, MemoryPortSizing.HeaderSize >> 2);
    this.header.fill(0);
    this.body = new Uint8Array(sab, offset + this.header.byteLength, byteLength - this.header.byteLength);
    this.lock();
  }

  public isLocked(): boolean {
    return !!this.header[HeaderIndex.Lock];
  }

  public lock(): void {
    this.header[HeaderIndex.Lock] = 1;
  }

  public unlock(): void {
    this.header[HeaderIndex.Lock] = 0;
  }

  public send(): void {
    Atomics.notify(this.header, HeaderIndex.Send, 1);
  }

  public async receive(): Promise<unknown> {
    this.unlock();
    const wait = Atomics.waitAsync(this.header, HeaderIndex.Send, 0);
    await wait.value;
    return decoder.decode(this.body);
  }
}
