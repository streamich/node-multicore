const {test} = require('./lib');
const {work} = require('./module');
const {fun} = require('../lib');

const main = async () => {
  await test('Single core', work);
  await test('Multi core', fun(work));
};

main();
