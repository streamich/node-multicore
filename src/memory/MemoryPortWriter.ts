import {Writer} from 'json-joy/lib/util/buffers/Writer';
import type {MemoryPort} from './MemoryPort';
import type {MemoryPortSlot} from './MemoryPortSlot';

export class MemoryPortWriter extends Writer {
  public slot?: MemoryPortSlot;

  constructor (protected readonly port: MemoryPort) {
    super(0);
  }

   protected grow(size: number) {
    const slot = this.port.find(size);
    if (slot) {
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
    const slot = this.port.find(256);
    if (slot) {
      this.slot = slot;
      this.uint8 = slot.body;
      return super.reset();
    }
    return super.reset();
  }
}
