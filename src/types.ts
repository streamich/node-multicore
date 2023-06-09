import type {TransferListItem} from 'worker_threads';
import type {WpModuleDefinitionFunc} from './module/WpModuleDefinitionFunc';
import type {WpModuleDefinitionStatic} from './module/WpModuleDefinitionStatic';
import type {WpModuleDefinitionCjsText} from './module/WpModuleDefinitionCjsText';

export * from './message/types';

export type TransferList = ReadonlyArray<TransferListItem>;

export type WpSend<Msg> = (data: Msg, transferList?: TransferList) => void;
export type WpRecv<Msg> = (callback: (data: Msg) => void) => void;

export type WpModuleDef = WpModuleDefinitionStatic | WpModuleDefinitionFunc | WpModuleDefinitionCjsText;
