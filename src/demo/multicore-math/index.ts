import {pool} from '../..';
import {resolve} from 'path';
import type {Methods} from './module';

export type {Methods};
export const specifier = resolve(__dirname, 'module');
export const module = pool.addModule(specifier).typed<Methods>();
