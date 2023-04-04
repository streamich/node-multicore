import {WorkerFn} from '../../src';
const MarkdownIt = require('markdown-it');

export const parse: WorkerFn<string, string> = (markdown: string) => {
  const md = new MarkdownIt();
  return md.render(markdown);
};

// These methods will be picked up by worker threads.
export const methods = {
  parse,
};

// This type will be used in the main thread.
export type Methods = typeof methods;
