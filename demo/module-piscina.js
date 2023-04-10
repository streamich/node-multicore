
const {resolve} = require('path');
const {pool} = require('../lib');
const Piscina = require('piscina');

const filename = resolve(__dirname, 'module.js');
const piscina = new Piscina({filename, maxThreads: pool.options.max});

exports.loop = (iterations) => {
  return piscina.run(iterations, {name: 'loop'});
};

exports.json = (iterations) => {
  return piscina.run(iterations, {name: 'json'});
};

exports.stringify = (value) => {
  return piscina.run(value, {name: 'stringify'});
};

exports.parse = (json) => {
  return piscina.run(json, {name: 'parse'});
};
