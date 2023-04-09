import {MessagePort} from "./constants";

export class MemoryPortWriteSlot {
  public readonly header: Int32Array;
  public readonly body: Uint8Array;
  public locked: boolean = false;

  constructor(
    sab: SharedArrayBuffer,
    offset: number,
    byteLength: number
  ) {
    this.header = new Int32Array(sab, offset, MessagePort.HeaderSize >> 2);
    this.header.fill(0);
    this.body = new Uint8Array(sab, offset + this.header.byteLength, byteLength - this.header.byteLength);
  }

  public lockAndNotify(): void {
    this.locked = true;
    const unlock = Atomics.waitAsync(this.header, 1, 0);
    if (!unlock.async) throw new Error('BROKEN_UNLOCK');
    unlock.value.then(() => {
      this.locked = false;
    });
    Atomics.notify(this.header, 0);
  }
}
