const {concurrency} = require('thingies');

const concurrencyLimit = 25;
const iterations = 10000;

const limit = concurrency(concurrencyLimit);

const run = async (work) => {
  const limitedWork = () => limit(work);
  let res = 0;
  const promises = [];
  for (let i = 0; i < iterations; i++) promises.push(limitedWork());
  const results = await Promise.all(promises);
  res += results.reduce((a, b) => a + b, 0);
  return res;
};

exports.test = async (name, work) => {
  console.log();
  console.log(`Running "${name}" case ...`);
  console.time(name);
  const res = await run(work);
  console.log('Result:', res);
  console.timeEnd(name);
};
