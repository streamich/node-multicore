import {Reader} from 'json-joy/lib/util/buffers/Reader';

export class MemoryPortReader extends Reader {
  public buf(size: number): Uint8Array {
    const bin = new Uint8Array(size);
    const end = this.x + size;
    bin.set(this.uint8.subarray(this.x, end));
    this.x = end;
    return bin;
  }
}
