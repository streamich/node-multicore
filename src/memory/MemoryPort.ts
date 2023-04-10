import {MemoryPortSlot} from "./MemoryPortSlot";
import {MemoryPortSizing} from "./constants";

export class MemoryPort {
  public static create(): MemoryPort {
    return new MemoryPort([512, 512, 512, 1024, 1024, 1024, 2048, 2048, 4096, 4096, 8192, 8192, 16384]);
  }

  public readonly sab: SharedArrayBuffer;
  public readonly slots: MemoryPortSlot[];
  public onmessage: (data: unknown) => void = () => {};

  /**
   * @param slotBodySizes Slot body sizes in bytes, sorted ASC.
   */
  constructor (slotBodySizes: number[], sab?: SharedArrayBuffer) {
    const totalSize = slotBodySizes.reduce((a, b) => a + MemoryPortSizing.HeaderSize + b, 0);
    if (sab && sab.byteLength !== totalSize) throw new Error('INVALID_SIZE');
    this.sab = sab ?? new SharedArrayBuffer(totalSize);
    const slots: MemoryPortSlot[] = [];
    let offset = 0;
    for (let i = 0; i < slotBodySizes.length; i++) {
      const slotBodySize = slotBodySizes[i];
      const slotSize = MemoryPortSizing.HeaderSize + slotBodySize;
      const slot = new MemoryPortSlot(i, this.sab, offset, slotSize);
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
      if (slot.body.byteLength >= minSize && !slot.isLocked()) return slot;
    }
    return undefined;
  }

  public acquire(minSize: number): MemoryPortSlot | undefined {
    const slot = this.find(minSize);
    if (slot) slot.lock();
    return slot;
  }
  
  public subscribe(): void {
    for (const slot of this.slots) this.subscribeSlot(slot);
  }

  private subscribeSlot(slot: MemoryPortSlot): void {
    slot.receive()
      .then((data) => this.onmessage(data))
      .catch(() => {})
      .finally(() => this.subscribeSlot(slot));
  }
}
