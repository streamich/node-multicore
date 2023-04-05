import {getSharedPool} from '..';

test('can shutdown the worker pool and exit', async () => {
  const pool = await getSharedPool();
  await pool.shutdown();
}, 30000);
