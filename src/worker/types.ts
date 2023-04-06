import type {WorkerResponse} from './WorkerResponse';
import type {WpSend, WpRecv} from '../types';

export interface WorkerModule {
  external: WorkerMethodsMap;
}

export type WorkerMethodsMap = Readonly<{[key: string]: WorkerMethod<any, any, any, any>}>;

export type WorkerMethod<Req = unknown, Res = unknown, In = unknown, Out = unknown> =
  | unknown // Constant value.
  | WorkerFn<Req, Res>
  | WorkerCh<Req, Res, In, Out>;

export type WorkerFn<Req = unknown, Res = unknown> = (req: Req) => MaybePromise<Response<Res>>;

export type WorkerCh<Req = unknown, Res = unknown, In = unknown, Out = unknown> = (
  req: Req,
  send: WpSend<Out>,
  recv: WpRecv<In>,
) => MaybePromise<Response<Res>>;

export type Response<R> = R | WorkerResponse<R>;

export type MaybePromise<T> = T | Promise<T>;
