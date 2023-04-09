export interface MemoryChannelExport {
  incoming: SharedArrayBuffer;
  incomingSlots: number[];
  outgoing: SharedArrayBuffer;
  outgoingSlots: number[];
}
