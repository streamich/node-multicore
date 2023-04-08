import {module as markdown} from '../demo/multicore-markdown';

test('can pass in string and receive string back', async () => {
  const res = await markdown.exec('parse', '# Hello World');
  expect(res).toBe('<h1>Hello World</h1>\n');
});
