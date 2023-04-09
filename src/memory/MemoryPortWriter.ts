import {Writer} from 'json-joy/lib/util/buffers/Writer';
import type {MemoryPort} from './MemoryPort';
import type {MemoryPortSlot} from './MemoryPortSlot';

export class MemoryPortWriter extends Writer {
  public slot?: MemoryPortSlot;

  constructor (protected readonly port: MemoryPort) {
    super(0);
  }

  protected releaseSlot() {
    if (this.slot) this.slot.locked = false;
    this.slot = undefined;
  } 

  protected grow(size: number) {
    this.releaseSlot();
    const slot = this.port.find(size);
    if (slot) {
      slot.locked = true;
      this.slot = slot;
      const newUint8 = slot.body;
      newUint8.set(this.uint8);
      this.uint8 = newUint8;
      this.view = new DataView(newUint8.buffer);
      return;
    }
    super.grow(size);
  }

  public reset() {
    this.releaseSlot();
    const slot = this.port.find(256);
    if (slot) {
      slot.locked = true;
      this.slot = slot;
      this.uint8 = slot.body;
      return super.reset();
    }
    return super.reset();
  }

  public flush(): Uint8Array {
    return this.uint8.subarray(0, this.x);
  }

  public flushSlot(): MemoryPortSlot | undefined {
    const slot = this.slot;
    this.slot = undefined;
    return slot;
  }
}
