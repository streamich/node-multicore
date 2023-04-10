# Node Multicore

Parallel programming for Node.js made easy. Make any CommonJs or ESM module
run in a thread pool.

- __Global thread pool__&mdash;Node Multicore is designed to be a global shared
  thread pool for all compute intensive NPM packages.
- Create a custom thread pool, or use a global shared one, designed to work
  across all NPM packages.
- Instant start&mdash;dynamic thread pool starts with 0 threads and scales up to
  the number of CPU cores as the load increases.
- Quickly load modules to the thread pool. Module concurrency is dynamic as well,
  initially a module is not loaded in any of the threads, as the module
  concurrency rises, the module is gradually loaded in more worker threads.
- Channels&mdash;on each function invocation a bi-directional data channel is created
  for that function, which allows you to stream data to the function and back.
- Ability to pin a module to a single thread. Say, your thread holds state&mdash;
  you can pin execution to a single thread, making subsequent method call hit
  the same thread.
- Quickly create a single function, which is loaded in worker threads.
- Dead threads are automatically removed from the thread pool.
- Fash&mdash;Node Multicore is as fast or faster as `poolifier` and `piscina`.
- Shared thread pool&mdash;Node Multicore thread pool is designed to be a global
  shared thread pool for all compute intensive NPM packages.


## Getting started

Install the package

```
npm install node-multicore
```

Create a `module.ts` that should be executed in the thread pool

```ts
import {WorkerFn} from 'node-multicore';

export const add: WorkerFn<[number, number], number> = ([a, b]) => {
  return a + b;
};
```

Load your module from the main thread

```ts
import {resolve} from 'path';
import {pool} from 'node-multicore';

const path = resolve(__dirname, 'module');
type Methods = typeof import('./module');

const math = pool.module(path).typed<Methods>();
```

Now call your methods from the main thread

```ts
const result = await math.exec('add', [1, 2]); // 3
```


## Usage guide

- The thread pool
- Modules
- Channels
- Pinning a thread
- Transferring data by ownership
- Anonymous function modules
- [Dynamic CommonJs modules](#dynamic-commonjs-modules)
- Creating multicore packages

### Loading a module

This is the preferred way to use this library, it will load a module in the
thread pool and you can call its exported functions.

Create a module you want to be loaded in the thread pool, put it in a `module.ts` file:

```ts
export const add = ([a, b]) => a + b;
```

Now add your module to the thread pool:

```ts
import {pool} from 'node-multicore';

const filename = __dirname + '/module';
type Methods = typeof import('./module');

const module = pool.module(filename).typed<Methods>();
```

You can now call the exported functions from the module:

```ts
const result = await module.exec('add', [1, 2]); // 3
```


### Loading a function

This method will create a module out of a single function and load it in the
thread pool.

```ts
import {fun} from 'node-multicore';

const fn = fun((a: number, b: number) => a + b);

const result = await fn(1, 2); // 3
```

### Channels

Channels are a way to stream data to a function and back. A channel is created
for each function call. The channel is a duplex stream, which means you can
write to it and read from it.


### Dynamic CommonJs modules

You can load a CommonJs module from a string. This is useful if you want to
load a module dynamically. It is loaded into threads progressively, as the
module concurrency rises. After you are done with the module, you can unload it.

Create a CommonJs text module:

```ts
import {pool} from '..';

const text = /* js */ `

let state = 0;

exports.add = ([a, b]) => {
  return a + b;
}

exports.set = (value) => state = value;
exports.get = () => state;

`;
```

Load it using the `pool.js()` method:

```ts
const module = pool.cjs(text);
```

Now you can use it as any other module:

```ts
// Execute a function exported by the module
const result = await module.exec('add', [1, 2]);
console.log(result); // 3

// Pin module to a single random thread, so multiple calls access the same state
const pinned = module.pinned();
await pinned.ch('set', 123).result;
const get = await pinned.ch('get', void 0).result;
console.log(get); // 123
```

Once you don't need this module, you can unload it:

```ts
// Unload the module, once it's no longer needed
await module.unload();
// await module.exec will throw an error now
```

Run a demo with the following command:

```bash
node -r ts-node/register src/demo/cjs-text.ts
```


## Demo / Benchmark

Run a demo with the following commands:

```bash
yarn
yarn demo
```

The demo executes this [`work` function](demo/module.js) on a single core vs.
in the thread pool. The results are printed to the console.

Sample output:

```
CPU = Apple M1, Cores = 8, Max threads = 7, Node = v18.15.0, Arch = arm64, OS = darwin
Warmup ...
Thread pool: node-multicore (concurrency = 2): 5.280s
Thread pool: piscina (concurrency = 2): 5.214s
Thread pool: worker-nodes (concurrency = 2): 5.255s
Thread pool: node-multicore (concurrency = 4): 3.510s
Thread pool: piscina (concurrency = 4): 2.734s
Thread pool: worker-nodes (concurrency = 4): 2.747s
Thread pool: node-multicore (concurrency = 8): 2.598s
Thread pool: piscina (concurrency = 8): 2.178s
Thread pool: worker-nodes (concurrency = 8): 2.070s
Thread pool: node-multicore (concurrency = 16): 2.144s
Thread pool: piscina (concurrency = 16): 2.158s
Thread pool: worker-nodes (concurrency = 16): 2.045s
Thread pool: node-multicore (concurrency = 32): 1.919s
Thread pool: piscina (concurrency = 32): 2.153s
Thread pool: worker-nodes (concurrency = 32): 2.043s
Thread pool: node-multicore (concurrency = 64): 1.835s
Thread pool: piscina (concurrency = 64): 2.177s
Thread pool: worker-nodes (concurrency = 64): 2.044s
Thread pool: node-multicore (concurrency = 128): 1.843s
Thread pool: piscina (concurrency = 128): 2.145s
Thread pool: worker-nodes (concurrency = 128): 2.046s
Thread pool: node-multicore (concurrency = 256): 1.820s
Thread pool: piscina (concurrency = 256): 2.116s
Thread pool: worker-nodes (concurrency = 256): 2.020s
Thread pool: node-multicore (concurrency = 512): 1.797s
Thread pool: piscina (concurrency = 512): 2.088s
Thread pool: worker-nodes (concurrency = 512): 1.995s
Thread pool: node-multicore (concurrency = 1024): 1.787s
Thread pool: piscina (concurrency = 1024): 2.058s
Thread pool: worker-nodes (concurrency = 1024): 2.003s
Thread pool: node-multicore (concurrency = 1): 9.968s
Thread pool: piscina (concurrency = 1): 9.995s
Thread pool: worker-nodes (concurrency = 1): 10.043s
On main thread (concurrency = 1): 9.616s
On main thread (concurrency = 10): 9.489s
```
