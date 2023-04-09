import {MemoryPort} from "./MemoryPort";
import {MemoryChannelExport} from "./types";

export class MemoryChannel {
  public static create(): MemoryChannel {
    return new MemoryChannel(MemoryPort.create(), MemoryPort.create());
  }

  constructor (public readonly incoming: MemoryPort, public readonly outgoing: MemoryPort) {}

  public export(): MemoryChannelExport {
    return {
      incoming: this.incoming.sab,
      incomingSlots: this.incoming.slots.map(slot => slot.body.byteLength),
      outgoing: this.outgoing.sab,
      outgoingSlots: this.outgoing.slots.map(slot => slot.body.byteLength),
    };
  }
}
