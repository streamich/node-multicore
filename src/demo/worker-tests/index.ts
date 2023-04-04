import {type WorkerPool, pool as getDefaultPool} from '../../../util/worker-pool';
import * as info from './info';

export * from './info';

export const init = async (pool?: WorkerPool) => {
  if (!pool) pool = await getDefaultPool();
  const module = await pool.addModule(info.id, info.file);
  return module.typed<info.Methods>();
};
