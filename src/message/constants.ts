export const enum MessageType {
  Request,
  Response,
  Error,
  ChannelData,
  WorkerReady,
  LoadModule,
  ModuleLoaded,
  UnloadModule,
}

export const enum MessagePort {
  HeaderSize = 4 * 2,
}
