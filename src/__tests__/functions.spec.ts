import {module as markdown} from '../demo/multicore-markdown';
import {module as math} from '../demo/multicore-math';
import {module as sleep} from '../demo/multicore-sleep';
import {module as tests} from '../demo/multicore-tests';

beforeAll(async () => {
  // await Promise.all([markdownInit(), mathInit(), sleepInit(), testsInit()]);
}, 30000);

test('can pass in string and receive string back', async () => {
  const res = await markdown.exec('parse', '# Hello World');
  expect(res).toBe('<h1>Hello World</h1>\n');
});
