import {createHash} from 'crypto';

export const sha256 = (data: string): string => {
  const shasum = createHash('sha256');
  shasum.update(data);
  return shasum.digest('hex');
};