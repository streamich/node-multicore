
const {resolve} = require('path');
const {cpus} = require('os');
const Piscina = require('piscina');

const filename = resolve(__dirname, 'module.js');
const piscina = new Piscina({filename, maxThreads: cpus().length - 1});

exports.loop = (iterations) => {
  return piscina.run(iterations, {name: 'loop'});
};

exports.json = async (iterations) => {
  return piscina.run(iterations, {name: 'json'});
};
