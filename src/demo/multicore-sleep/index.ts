import {type WorkerPool, getSharedPool} from '../..';
import * as info from './info';

export * from './info';

export const init = async (pool?: WorkerPool) => {
  if (!pool) pool = await getSharedPool();
  const module = await pool.addModule(info.id, info.file);
  return module.typed<info.Methods>();
};
