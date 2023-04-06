import {WorkerFn} from '../..';
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt();

export const parse: WorkerFn<string, string> = (markdown: string) => {
  return md.render(markdown);
};

// These methods will be picked up by worker threads.
export const external = {
  parse,
};

// This type will be used in the main thread.
export type Methods = typeof external;
