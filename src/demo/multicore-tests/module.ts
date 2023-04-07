/* tslint:disable no-string-throw */

import {type WorkerFn, msg} from '../..';

export const lol = 123;

export const constant: WorkerFn<void, string> = () => {
  return msg('25', []);
};

export const constantAsync: WorkerFn<void, string> = async () => {
  return msg('25', []);
};

export const throwsString: WorkerFn<void, void> = () => {
  throw 'OMG!';
};

export const throwsStringAsync: WorkerFn<void, void> = async () => {
  throw 'OMG!';
};

export const throwsError: WorkerFn<void, void> = () => {
  throw new Error('OMG!');
};

export const throwsErrorAsync: WorkerFn<void, void> = async () => {
  throw new Error('OMG!');
};

export const echo: WorkerFn<string, string> = (data: string) => {
  return msg(data, []);
};

let value: any;

export const set: WorkerFn<any, void> = (data: any) => {
  value = data;
};

export const get: WorkerFn<void, any> = () => {
  return value;
};

export const bufferSet: WorkerFn<{arr: Uint8Array; pos: number; octet: number}, Uint8Array> = ({arr, pos, octet}) => {
  arr[pos] = octet;
  return arr;
};

export const bufferSetTransfer: WorkerFn<{arr: Uint8Array; pos: number; octet: number}, Uint8Array> = ({arr, pos, octet}) => {
  arr[pos] = octet;
  return msg(arr, [arr.buffer]);
};
