/* tslint:disable no-string-throw */

import {type WorkerFn, msg} from '../..';

const constant: WorkerFn<void, string> = () => {
  return msg('25', []);
};

const constantAsync: WorkerFn<void, string> = async () => {
  return msg('25', []);
};

const throwsString: WorkerFn<void, void> = () => {
  throw 'OMG!';
};

const throwsStringAsync: WorkerFn<void, void> = async () => {
  throw 'OMG!';
};

const throwsError: WorkerFn<void, void> = () => {
  throw new Error('OMG!');
};

const throwsErrorAsync: WorkerFn<void, void> = async () => {
  throw new Error('OMG!');
};

const echo: WorkerFn<string, string> = (data: string) => {
  return msg(data, []);
};

let value: any;

const set: WorkerFn<any, void> = (data: any) => {
  value = data;
};

const get: WorkerFn<void, any> = () => {
  return value;
};

const bufferSet: WorkerFn<{arr: Uint8Array; pos: number; octet: number}, Uint8Array> = ({arr, pos, octet}) => {
  arr[pos] = octet;
  return arr;
};

const bufferSetTransfer: WorkerFn<{arr: Uint8Array; pos: number; octet: number}, Uint8Array> = ({arr, pos, octet}) => {
  arr[pos] = octet;
  return msg(arr, [arr.buffer]);
};

// These methods will be picked up by worker threads.
export const methods = {
  lol: 123,
  constant,
  constantAsync,
  throwsString,
  throwsStringAsync,
  throwsError,
  throwsErrorAsync,
  echo,
  set,
  get,
  bufferSet,
  bufferSetTransfer,
};

// This type will be used in the main thread.
export type Methods = typeof methods;
