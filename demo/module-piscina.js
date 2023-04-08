
const {resolve} = require('path');
const {pool} = require('../lib');
const Piscina = require('piscina');

const filename = resolve(__dirname, 'module.js');
const piscina = new Piscina({filename, maxThreads: pool.options.max});

exports.loop = (iterations) => {
  return piscina.run(iterations, {name: 'loop'});
};

exports.json = async (iterations) => {
  return piscina.run(iterations, {name: 'json'});
};
