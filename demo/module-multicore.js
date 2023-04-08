const {resolve} = require('path');
const {pool} = require('../lib');

const filename = resolve(__dirname, 'module.js');
const mod = pool.module(filename);

exports.loop = (iterations) => {
  return mod.exec('loop', iterations);
};

exports.json = async (iterations) => {
  return mod.exec('json', iterations);
};
