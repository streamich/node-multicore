const {cpus} = require('os');
const {test} = require('./lib');
const moduleNative = require('./module');
const moduleMulticore = require('./module-multicore');
const modulePiscina = require('./module-piscina');
const {pool} = require('../lib');

const concurrencies = [1, 2, 3, 4, 5, 6, 7, 10, 25, 100, 500];

const main = async () => {
  console.log(`CPU = ${cpus()[0].model}, Cores = ${cpus().length}, Max threads = ${pool.options.max}`);
  
  await test('On main thread', moduleNative.loop, 1);
  await test('On main thread', moduleNative.loop, 10);
  
  for (const concurrency of concurrencies) {
    await test('Thread pool: multicore', moduleMulticore.loop, concurrency);
    await test('Thread pool: piscina', modulePiscina.loop, concurrency);
  }
};

main();
