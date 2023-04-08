const {cpus} = require('os');
const {test} = require('./lib');
const {work} = require('./module');
const {pool, fun} = require('../lib');

const concurrencies = [1, 2, 3, 4, 5, 6, 7, 10, 25, 100, 500];

const main = async () => {
  console.log(`CPU = ${cpus()[0].model}, Cores = ${cpus().length}, Max threads = ${pool.options.max}`);
  const work2 = fun(work);
  await test('On main thread', work, 1);
  await test('On main thread', work, 10);
  for (const concurrency of concurrencies) {
    await test('In thread pool', work2, concurrency);
  }
};

main();
