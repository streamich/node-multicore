import {pool} from '..';

test('can shutdown the worker pool and exit', async () => {
  await pool.addWorker();
  await pool.shutdown();
}, 30000);
