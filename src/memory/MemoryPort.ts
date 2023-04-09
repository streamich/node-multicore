import {MemoryPortSlot} from "./MemoryPortSlot";
import {decoder} from "./codec";
import {MemoryPortSizing} from "./constants";

export class MemoryPort {
  public static create(): MemoryPort {
    return new MemoryPort([512, 512, 512, 1024, 1024, 1024, 2048, 2048, 4096, 4096, 8192, 8192, 16384]);
  }

  public readonly sab: SharedArrayBuffer;
  public readonly slots: MemoryPortSlot[];
  public onmessage: (data: unknown, slot: MemoryPortSlot) => void = () => {};

  /**
   * @param slotBodySizes Slot body sizes in bytes, sorted ASC.
   */
  constructor (slotBodySizes: number[], sab?: SharedArrayBuffer) {
    const totalSize = slotBodySizes.reduce((a, b) => a + MemoryPortSizing.HeaderSize + b, 0);
    if (sab && sab.byteLength !== totalSize) throw new Error('INVALID_SIZE');
    this.sab = sab ?? new SharedArrayBuffer(totalSize);
    const slots: MemoryPortSlot[] = [];
    let offset = 0;
    for (let slotBodySize of slotBodySizes) {
      const slotSize = MemoryPortSizing.HeaderSize + slotBodySize;
      const slot = new MemoryPortSlot(this.sab, offset, slotSize);
      offset += slotSize;
      slots.push(slot);
    }
    this.slots = slots;
  }

  public find(minSize: number): MemoryPortSlot | undefined {
    const slots = this.slots;
    const length = slots.length;
    for (let i = 0; i < length; i++) {
      const slot = slots[i];
      if (!slot.locked && slot.body.byteLength >= minSize) return slot;
    }
    return undefined;
  }
  
  public subscribe(): void {
    for (const slot of this.slots) this.subscribeSlot(slot);
  }

  private subscribeSlot(slot: MemoryPortSlot): void {
    slot.receive().then(() => {
      try {
        const body = slot.body;
        const data = decoder.decode(body);
        this.onmessage(data, slot);
      } finally {
        slot.unlock();
      }
    });
  }
}
