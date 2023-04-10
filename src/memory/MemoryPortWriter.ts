import {Writer} from 'json-joy/lib/util/buffers/Writer';
import type {MemoryPort} from './MemoryPort';
import type {MemoryPortSlot} from './MemoryPortSlot';

export class MemoryPortWriter extends Writer {
  public slot?: MemoryPortSlot;

  constructor (protected readonly port: MemoryPort) {
    super(0);
  }

  protected grow(size: number) {
    const slot = this.port.acquire(size);
    if (slot) {
      const newUint8 = slot.body;
      newUint8.set(this.uint8);
      this.uint8 = newUint8;
      this.view = new DataView(newUint8.buffer);
      if (this.slot) this.slot.unlock();
      this.slot = slot;
    } else {
      if (this.slot) {
        this.slot.unlock();
        this.slot = undefined;
      }
      super.grow(size);
    }
  }

  public reset() {
    const startSize = 256;
    this.slot = this.port.acquire(startSize);
    this.uint8 = this.slot ? this.slot.body : new Uint8Array(startSize);
    return super.reset();
  }

  public flush(): Uint8Array {
    return this.uint8.subarray(0, this.x);
  }
}
