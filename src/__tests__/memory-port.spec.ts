import {pool} from '..';
import {module as math} from '../demo/multicore-math';

test('...', async () => {
  await pool.grow();
  console.log('pool');
});
