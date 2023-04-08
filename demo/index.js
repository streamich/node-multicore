const {cpus} = require('os');
const {warmup, test} = require('./lib');
const moduleNative = require('./module');
const moduleMulticore = require('./module-multicore');
const moduleWorkerNodes = require('./module-worker-nodes');
const modulePiscina = require('./module-piscina');
const {pool} = require('../lib');

const concurrencies = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 1];

const main = async () => {
  console.log(`CPU = ${cpus()[0].model}, Cores = ${cpus().length}, Max threads = ${pool.options.max}, Node = ${process.version}, Arch = ${process.arch}, OS = ${process.platform}`);

  console.log('Warmup ...')
  await warmup(moduleNative.loop);
  await warmup(moduleMulticore.loop);
  await warmup(modulePiscina.loop);
  await warmup(moduleWorkerNodes.loop);
  
  for (const concurrency of concurrencies) {
    await test('Thread pool: node-multicore', moduleMulticore.loop, concurrency);
    await test('Thread pool: piscina', modulePiscina.loop, concurrency);
    await test('Thread pool: worker-nodes', moduleWorkerNodes.loop, concurrency);
  }
  
  await test('On main thread', moduleNative.loop, 1);
  await test('On main thread', moduleNative.loop, 10);
};

main();
