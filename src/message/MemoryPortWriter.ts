import {MemoryPortWriteSlot} from "./MemoryPortWriteSlot";
import {MessagePort} from "./constants";

export class MemoryPortWriter {
  public static create(): MemoryPortWriter {
    return new MemoryPortWriter([256, 512, 1024, 2048, 2048, 4096, 4096, 8192, 8192, 16384, 16384, 32768]);
  }

  public readonly slots: MemoryPortWriteSlot[];

  /**
   * @param slotBodySizes Slot body sizes in bytes, sorted ASC.
   */
  constructor (slotBodySizes: number[]) {
    const totalSize = slotBodySizes.reduce((a, b) => a + MessagePort.HeaderSize + b, 0);
    const sab = new SharedArrayBuffer(totalSize);
    const slots: MemoryPortWriteSlot[] = [];
    let offset = 0;
    for (let slotBodySize of slotBodySizes) {
      const slotSize = MessagePort.HeaderSize + slotBodySize;
      const slot = new MemoryPortWriteSlot(sab, offset, slotSize);
      offset += slotSize;
      slots.push(slot);
    }
    this.slots = slots;
  }

  public find(minSize: number): MemoryPortWriteSlot | undefined {
    const slots = this.slots;
    const length = slots.length;
    for (let i = 0; i < length; i++) {
      const slot = slots[i];
      if (!slot.locked && slot.body.byteLength >= minSize) return slot;
    }
    return undefined;
  }
}
