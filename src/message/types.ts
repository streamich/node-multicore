import type {MessageType} from './constants';

export type {MessageType};

export type WpMessage = WpRpcMessage | WpControlMessage;
export type WpRpcMessage = WpMsgRequest | WpMsgResponse | WpMsgError | WpMsgChannelData;
export type WpControlMessage = WPMsgWorkerReady | WpMsgLoadModule | WpMsgModuleLoaded;

export type WpMsgRequest<T = unknown> = [type: MessageType.Request, seq: number, method: number, data: T];
export type WpMsgResponse<T = unknown> = [type: MessageType.Response, seq: number, data: T];
export type WpMsgError<T = unknown> = [type: MessageType.Error, seq: number, data: T];

export type WpMsgChannelData<T = unknown> = [type: MessageType.ChannelData, seq: number, data: T];

export type WPMsgWorkerReady = [type: MessageType.WorkerReady];
export type WpMsgLoadModule = [
  type: MessageType.LoadModule,
  id: number,
  def: WpMsgLoadDefinitionStatic | WpMsgLoadDefinitionFunc | WpMsgLoadDefinitionCjsText,
];
export type WpMsgModuleLoaded = [type: MessageType.ModuleLoaded, id: number, methods: string[]];

export interface WpMsgLoadDefinitionStatic {
  type: 'static';
  specifier: string;
}

export interface WpMsgLoadDefinitionFunc {
  type: 'func';
  text: string;
}

export interface WpMsgLoadDefinitionCjsText {
  type: 'cjs';
  text: string;
}
