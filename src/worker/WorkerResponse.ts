import type {TransferList} from '../types';

export class WorkerResponse<D = unknown> {
  constructor(public readonly data: D, public readonly transferList: TransferList) {}
}

export const msg = <D = unknown>(data: D, transferList: TransferList) => new WorkerResponse(data, transferList);
