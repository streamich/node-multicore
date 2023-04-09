import {pool} from '..';
import {module as math} from '../demo/multicore-math';

test('...', async () => {
  await pool.grow();
  const res = await math.exec('add', [1, 1]);
  console.log('res', res);
});
