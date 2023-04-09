import {MemoryPortWriteSlot} from "./MemoryPortWriteSlot";
import {MessagePort} from "./constants";

export class MemoryPortWriter {
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
    for (let slot of this.slots)
      if (!slot.locked && slot.body.byteLength >= minSize) return slot;
    return undefined;
  }
}
