
const {resolve} = require('path');
const Piscina = require('piscina');

const filename = resolve(__dirname, 'module.js');
const piscina = new Piscina({filename, useAtomics: false});

exports.loop = (iterations) => {
  return piscina.run(iterations, {name: 'loop'});
};

exports.json = async (iterations) => {
  return piscina.run(iterations, {name: 'json'});
};
