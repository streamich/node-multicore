const {cpus} = require('os');
const {warmup, test} = require('./lib');
const moduleNative = require('./module');
const moduleMulticore = require('./module-multicore');
const moduleWorkerNodes = require('./module-worker-nodes');
const modulePiscina = require('./module-piscina');
const {pool} = require('../lib');

const concurrencies = [1, 2, 3, 4, 5, 6, 7, 10, 25, 100, 500];

const main = async () => {
  console.log(`CPU = ${cpus()[0].model}, Cores = ${cpus().length}, Max threads = ${pool.options.max}, Node = ${process.version}, Arch = ${process.arch}, OS = ${process.platform}`);

  console.log('Warmup ...')
  await warmup(moduleNative.loop);
  await warmup(moduleMulticore.loop);
  await warmup(modulePiscina.loop);
  await warmup(moduleWorkerNodes.loop);
  
  await test('On main thread', moduleNative.loop, 1);
  await test('On main thread', moduleNative.loop, 10);
  
  for (const concurrency of concurrencies) {
    await test('Thread pool: node-multicore', moduleMulticore.loop, concurrency);
    await test('Thread pool: piscina', modulePiscina.loop, concurrency);
    await test('Thread pool: worker-nodes', moduleWorkerNodes.loop, concurrency);
  }
};

main();
