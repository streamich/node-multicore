import {getSharedPool} from '..';

test('unref workers to gracefully exit without dangling handlers', async () => {
  await getSharedPool();
}, 30000);
