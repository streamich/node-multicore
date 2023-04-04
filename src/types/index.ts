import type {TransferListItem} from 'worker_threads';
import type {WorkerResponse} from '../WorkerResponse';

export * from './messaging';

export type TransferList = ReadonlyArray<TransferListItem>;

export type WpSend<Msg> = (data: Msg | WorkerResponse<Msg>) => void;
export type WpRecv<Msg> = (callback: (data: Msg) => void) => void;
