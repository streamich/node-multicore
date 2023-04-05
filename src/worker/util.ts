import type {WpRecv} from '../types';

export const taker =
  <Msg>(recv: WpRecv<Msg>): (() => Promise<Msg>) =>
  () =>
    new Promise((resolve) => recv(resolve));
