import {HeaderIndex, MemoryPortSizing} from "./constants";

export class MemoryPortSlot {
  public readonly header: Int32Array;
  public readonly body: Uint8Array;
  public locked: boolean = false;

  constructor(
    sab: SharedArrayBuffer,
    offset: number,
    byteLength: number
  ) {
    this.header = new Int32Array(sab, offset, MemoryPortSizing.HeaderSize >> 2);
    this.header.fill(0);
    this.body = new Uint8Array(sab, offset + this.header.byteLength, byteLength - this.header.byteLength);
  }

  public lock(): void {
    this.locked = true;
  }

  public send(): void {
    const unlock = Atomics.waitAsync(this.header, HeaderIndex.Unlock, 0);
    if (!unlock.async) {
      this.locked = false;
      throw new Error('BROKEN_UNLOCK');
    }
    unlock.value.then(() => {
      this.locked = false;
    });
    Atomics.notify(this.header, HeaderIndex.Send);
  }

  public async receive(): Promise<void> {
    const unlock = Atomics.waitAsync(this.header, HeaderIndex.Send, 0);
    if (!unlock.async) {
      this.locked = false;
      throw new Error('BROKEN_RECEIVE');
    }
    await unlock.value;
  }

  public unlock(): void {
    Atomics.notify(this.header, HeaderIndex.Unlock);
  }
}
