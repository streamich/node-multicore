import {CborDecoder} from 'json-joy/es2020/json-pack/cbor/CborDecoder';
import {MemoryPortReader} from './MemoryPortReader';

const reader = new MemoryPortReader();
export const decoder = new CborDecoder(reader);
