import type {TransferListItem} from 'worker_threads';
import type {WpModuleDefinitionFunc} from '../WpModuleDefinitionFunc';
import type {WpModuleDefinitionStatic} from '../WpModuleDefinitionStatic';

export * from './messaging';

export type TransferList = ReadonlyArray<TransferListItem>;

export type WpSend<Msg> = (data: Msg, transferList?: TransferList) => void;
export type WpRecv<Msg> = (callback: (data: Msg) => void) => void;

export type WpModuleDef = WpModuleDefinitionStatic | WpModuleDefinitionFunc;
