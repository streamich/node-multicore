export interface MemoryChannelExport {
  incoming: SharedArrayBuffer;
  incomingSlots: number[];
  outgoing: SharedArrayBuffer;
  outgoingSlots: number[];
}

export type Send = (data: Uint8Array) => void;
