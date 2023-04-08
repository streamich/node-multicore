const {bootstrapThreadPool, test} = require('./lib');
const {work} = require('./module');

const main = async () => {
  const multicoreWork = await bootstrapThreadPool();

  await test('Single core', work);
  await test('Multi core', multicoreWork);
};

main();
