export type WpMessage = WpRpcMessage | WpControlMessage;
export type WpRpcMessage = WpMsgRequest | WpMsgResponse | WpMsgError | WpMsgChannel;
export type WpControlMessage = WPMsgWorkerReady | WpMsgLoad | WpMsgLoaded;

/** Request to execute a function in a worker. */
export type WpMsgRequest<T = unknown> = [seq: number, method: number, data: T];

/** Response of a worker function execution. */
export type WpMsgResponse<T = unknown> = [seq: number, data: T];

/** An error response of a worker function. */
export type WpMsgError<T = unknown> = [seq: number, data: T, isError: true];

/** A channel message, which can be sent back-and-forth during a worker function execution. */
export type WpMsgChannel<T = unknown> = [seq: [number], data: T];

/** Message that worker sends when it has loaded. */
export interface WPMsgWorkerReady {
  type: 'ready';
}

/** Main thread request to load a module by a worker. */
export interface WpMsgLoad {
  type: 'load';
  id: number;
  specifier: string;
}

/** Module "loaded" response by a worker. */
export interface WpMsgLoaded {
  type: 'loaded';
  id: number;
  /**
   * List of exported things from the module. Sorted by alphabetical order.
   */
  methods: string[];
}
