/* tslint:disable no-console */
// node -r ts-node/register src/demo/cjs-text.ts

import {pool} from '..';

const text = /* js */ `

let state = 0;

exports.add = ([a, b]) => {
  return a + b;
}

exports.set = (value) => state = value;
exports.get = () => state;

`;

const main = async () => {
  // Load a CommonJS module from a string
  const module = pool.cjs(text);

  // Execute a function exported by the module
  const result = await module.exec('add', [1, 2]);
  console.log(result); // 3

  // Pin module to a single random thread, so multiple calls access the same state
  const pinned = module.pinned();
  await pinned.ch('set', 123).result;
  const get = await pinned.ch('get', void 0).result;
  console.log(get); // 123

  // Unload the module, once it's no longer needed
  await module.unload();
  // await module.exec will throw an error
};

main();
