import {WorkerFn} from '../..';
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt();

export const parse: WorkerFn<string, string> = (markdown: string) => {
  return md.render(markdown);
};
