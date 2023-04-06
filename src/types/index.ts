import type {TransferListItem} from 'worker_threads';

export * from './messaging';

export type TransferList = ReadonlyArray<TransferListItem>;

export type WpSend<Msg> = (data: Msg, transferList?: TransferList) => void;
export type WpRecv<Msg> = (callback: (data: Msg) => void) => void;
