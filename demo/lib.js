'use strict';

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

exports.json1 = {
  id: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
  name: 'John Doe',
  age: 25,
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
  },
  phoneNumbers: [
    {type: 'home', number: '123-456-7890'},
    {type: 'mobile', number: '123-456-7890'},
  ],
  children: [],
  spouse: null,
};

exports.json2 = {
  a: 1,
  b: 2,
  arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  obj: {
    a: 1,
    bool: true,
    str: 'string',
    longName: 'A very long string that will be sent to the worker',
  },
};

exports.warmup = async (work) => {
  for (let i = 0; i < 24; i++)
    await Promise.all(Array.from({length: 24}, () => work()));
};

exports.test = async (name, module) => {
  const res = await module.loop();
  if (res !== 499999500000) throw new Error(`Wrong result [module = ${name}]  module.loop() ${res}`);
  const res2 = await module.stringify({foo: 'bar'});
  if (res2 !== JSON.stringify({foo: 'bar'})) throw new Error(`Wrong result [module = ${name}] module.json() ${res2}`);
  const res3 = await module.parse(JSON.stringify({foo: 'bar'}));
  if (res3.foo !== 'bar') throw new Error(`Wrong result [module = ${name}] module.parse() ${res3.foo}`);
};

exports.bench = async (name, work, concurrencyLimit = 25) => {
  const timingName = `${name} (concurrency = ${concurrencyLimit})`;
  console.time(timingName);
  await run(work, concurrencyLimit);
  console.timeEnd(timingName);
};
