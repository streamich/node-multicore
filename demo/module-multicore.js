const {resolve} = require('path');
const {pool} = require('../lib');

const filename = resolve(__dirname, 'module.js');
const mod = pool.module(filename);

exports.loop = (iterations) => {
  return mod.exec('loop', iterations);
};

exports.json = (iterations) => {
  return mod.exec('json', iterations);
};

exports.stringify = (value) => {
  return mod.exec('stringify', value);
};

exports.parse = (json) => {
  return mod.exec('parse', json);
};
