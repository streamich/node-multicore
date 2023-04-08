const {concurrency} = require('thingies');

const iterations = 10000;

const run = async (work, concurrencyLimit) => {
  const limit = concurrency(concurrencyLimit);
  let res = 0;
  const promises = [];
  for (let i = 0; i < iterations; i++) promises.push(limit(work));
  const results = await Promise.all(promises);
  res += results.reduce((a, b) => a + b, 0);
  return res;
};

exports.test = async (name, work, concurrencyLimit = 25) => {
  console.log();
  console.log(`Running "${name}" case (concurrency = ${concurrencyLimit}) ...`);
  console.time('Time');
  const res = await run(work, concurrencyLimit);
  console.log('Result:', res === iterations * 499999500000 ? 'OK' : 'FAIL');
  console.timeEnd('Time');
};
