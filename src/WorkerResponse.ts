import type {TransferList} from './types';

// TODO: Move this to /worker
export class WorkerResponse<D = unknown> {
  constructor(public readonly data: D, public readonly transferList: TransferList) {}
}

export const msg = <D = unknown>(data: D, transferList: TransferList) =>
  new WorkerResponse(data, transferList);
