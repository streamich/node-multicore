const {resolve} = require('path');
const {pool} = require('../lib');
const WorkerNodes = require('worker-nodes');

const filename = resolve(__dirname, 'module.js');
const nodes = new WorkerNodes(filename, {maxWorkers: pool.options.max});

exports.loop = (iterations) => {
  return nodes.call.loop(iterations);
};

exports.json = (iterations) => {
  return nodes.call.json(iterations);
};

exports.stringify = (value) => {
  return nodes.call.stringify(value);
};

exports.parse = (json) => {
  return nodes.call.parse(json);
};
