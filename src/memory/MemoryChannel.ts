import {CborEncoder} from 'json-joy/es2020/json-pack/cbor/CborEncoder';
import {MemoryPort} from "./MemoryPort";
import {MemoryPortWriter} from './MemoryPortWriter';
import type {MemoryChannelExport, Send} from "./types";
import type {MemoryPortSlot} from "./MemoryPortSlot";

export class MemoryChannel {
  public static create(): MemoryChannel {
    return new MemoryChannel(MemoryPort.create(), MemoryPort.create());
  }

  public onLargeMessage: Send = () => {};

  protected readonly writer: MemoryPortWriter;
  protected readonly encoder: CborEncoder;

  constructor (public readonly incoming: MemoryPort, public readonly outgoing: MemoryPort) {
    this.writer = new MemoryPortWriter(outgoing);
    this.encoder = new CborEncoder(this.writer);
  }

  public subscribe(onmessage: (data: unknown, slot: MemoryPortSlot) => void = () => {}) {
    this.incoming.onmessage = onmessage;
    this.incoming.subscribe();
  }

  public export(): MemoryChannelExport {
    return {
      incoming: this.incoming.sab,
      incomingSlots: this.incoming.slots.map(slot => slot.body.byteLength),
      outgoing: this.outgoing.sab,
      outgoingSlots: this.outgoing.slots.map(slot => slot.body.byteLength),
    };
  }

  public send(copy: unknown): void {
    const {encoder, writer} = this;
    writer.reset();
    encoder.writeAny(copy);
    const slot = writer.slot;
    if (slot) slot.send();
    else this.onLargeMessage(writer.flush());
  }
}
