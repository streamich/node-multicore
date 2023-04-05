import {init as markdownInit} from '../demo/multicore-markdown';
import {init as mathInit} from '../demo/multicore-math';
import {init as sleepInit} from '../demo/multicore-sleep';
import {init as testsInit} from '../demo/multicore-tests';

beforeAll(async () => {
  await Promise.all([
    markdownInit(),
    mathInit(),
    sleepInit(),
    testsInit(),
  ]);
});

test('can pass in string and receive string back', async () => {
  const markdown = await markdownInit();
  const res = await markdown.exec('parse', '# Hello World');
  expect(res).toBe('<h1>Hello World</h1>\n');
});
