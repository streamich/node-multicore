import {pool} from '../..';
import {resolve} from 'path';

export type Methods = typeof import('./module');
export const specifier = resolve(__dirname, 'module');
export const module = pool.module(specifier).typed<Methods>();
