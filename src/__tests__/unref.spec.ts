import {pool} from '..';

test('unref workers to gracefully exit without dangling handlers', async () => {
  await pool.addWorker();
}, 30000);
