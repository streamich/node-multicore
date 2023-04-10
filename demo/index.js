const {cpus} = require('os');
const {json1, json2, test, warmup, bench} = require('./lib');
const moduleNative = require('./module');
const moduleMulticore = require('./module-multicore');
const moduleWorkerNodes = require('./module-worker-nodes');
const modulePiscina = require('./module-piscina');
const {pool} = require('../lib');

const concurrencies = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 1];

const main = async () => {
  console.log(`CPU = ${cpus()[0].model}, Cores = ${cpus().length}, Max threads = ${pool.options.max}, Node = ${process.version}, Arch = ${process.arch}, OS = ${process.platform}`);

  await test('native', moduleNative);
  await test('multicore', moduleMulticore);
  await test('piscina', modulePiscina);
  await test('worker-nodes', moduleWorkerNodes);

  const json = JSON.stringify(json1);
  const createFn = (name, module) => async () => {
    const res1 = await module.loop();
    const res2 = await module.stringify(json2);
    const res3 = await module.parse(json);
    const obj = {res1, res2, res3};
    if (obj.res1 !== 499999500000) throw new Error(`Wrong result [module = ${name}]  module.loop() ${res1}`);
  };

  const fn = {
    native: createFn('native', moduleNative),
    multicore: createFn('multicore', moduleMulticore),
    piscina: createFn('piscina', modulePiscina),
    workerNodes: createFn('worker-nodes', moduleWorkerNodes),
  };

  console.log('Warmup ...')
  await warmup(fn.native);
  await warmup(fn.multicore);
  await warmup(fn.piscina);
  await warmup(fn.workerNodes);
  
  for (const concurrency of concurrencies) {
    await bench('Thread pool: node-multicore', fn.multicore, concurrency);
    await bench('Thread pool: piscina', fn.piscina, concurrency);
    await bench('Thread pool: worker-nodes', fn.workerNodes, concurrency);
  }
  
  await bench('On main thread', fn.native, 1);
  await bench('On main thread', fn.native, 10);
};

main();
