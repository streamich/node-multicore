# Node Multicore

Parallel programming for Node.js made easy. Make any CommonJs or ESM module
run in a thread pool.

- __Global thread pool:__ designed to be a shared thread pool for all NPM packages.
- __Custom threads pools:__ create a custom thread pool, if you need to.
- __Instant start__: dynamic thread pool starts with 0 threads and scales up to
  the number of CPU cores as the load increases.
- __Instant module loading:__ load modules to the thread pool dynamically and
  instantly&mdash;module is loaded in more threads as the module concurrency
  increases.
- __Channels:__ each function invocation creates a bi-directional data channel,
  which allows you to stream data to a worker thread and back to the main thread.
- __Pin work to a thread:__ ability to pin a module to a single thread. Say,
  your thread holds state&mdash;you can pin execution to a single thread, making
  subsequent method call hit the same thread.
- __Single function module:__ quickly create a single function modules by just
  defining the function in your code.
- __Dynamic:__ pool size grows as the concurrency rises, dead threads are replaced by new ones.
- __Fast:__ Node Multicore is as fast, see benchmarks below.

Table of contents:

- [Getting started](#getting-started)
- [The thread pool](#the-thread-pool)
  - [The global thread pool](#the-global-thread-pool)
  - [Creating a custom thread pool](#creating-a-custom-thread-pool)
- [Modules](#modules)
  - [Static modules](#static-modules)
  - [Single function modules](#single-function-modules)
  - [Dynamic CommonJs modules](#dynamic-commonjs-modules)
  - [*Module Expressions*](#module-expressions)
- [Module exports](#module-exports)
  - [Functions](#functions)
  - [Channels](#channels)
  - [Promises](#promises)
  - [Other exports](#other-exports)
- [Advanced concepts](#advanced-concepts)
  - [Pinning a thread](#pinning-a-thread)
  - [Transferring data by ownership](#transferring-data-by-ownership)
- Multicore packages
  - Creating `.multicore` packages
- [Demo / Benchmark](#demo--benchmark)


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

const specifier = resolve(__dirname, 'module');
type Methods = typeof import('./module');

const math = pool.module(specifier).typed<Methods>();
```

Now call your methods from the main thread

```ts
const result = await math.exec('add', [1, 2]); // 3
```


## The thread pool

### The global thread pool

The `node-multicore` thread pool is designed to be a single shared global thread
pool for all compute intensive NPM packages. You can import it as follows:

```ts
import {pool} from 'node-multicore';
```

The global thread pool starts with 0 threads and scales up to the number of CPUs
less 1, as the load increases. This is a design decision as this way the global
thread pool avoids overloading the CPU with threads. You can customize the
minimum and maxium number of threads in the thread pool using the `MC_MIN_THREAD_POOL_SIZE`
and `MC_MAX_THREAD_POOL_SIZE` environment variables.


### Creating a custom thread pool

The thread pool is designed to be a shared resource, so it is not
recommended to create your own pool. However, if you need to create a separate
one, you can:

```ts
import {WorkerPool} from 'node-multicore';

const dedicatedPool = new WorkerPool({});

// Instantiate the minimum number of threads
await dedicatedPool.init();
```

When creating a thread pool, you can pass the following options:

- `min` &mdash; minimum number of threads in the pool, defaults to `0` or
  `process.env.MC_MIN_THREAD_POOL_SIZE` environment setting.
- `max` &mdash; maximum number of threads in the pool, defaults to the number of
  CPUs less 1 or `process.env.MC_MAX_THREAD_POOL_SIZE` environment setting.
- `trackUnmanagedFds` &mdash; whether to track unmanaged file descriptors in
  worker threads and close them when the thread is terminated. Defaults to `false`.
- `name` &mdash; name of the thread pool, used for debugging purposes. Defaults
  to `multicore`.
- `resourceLimits` &mdash; resource limits for worker threads.
- `env` &mdash; environment variables for worker threads. Defaults to
  `process.env`.


## Modules

A unit of parallelism in JavaScript is a module. You can load a module in the
thread pool and call its exported functions.

Similar to the thread pool, each module is designed to be "lazy" as well. A
module is not loaded in any of the threads initially, but as the module
concurrency rises, the module is gradually loaded in more worker threads.


### Static modules

This is the preferred way to use this library, it will load a module by a global
"specifier" `pool.module(specifier)` in the thread pool and you can call its
exported functions.

To begin, first create a module you want to be loaded in the thread pool, put it
in a `module.ts` file:

```ts
export const add = ([a, b]) => a + b;
```

Now add your module to the thread pool:

```ts
import {resolve} from 'path';

const specifier = resolve(__dirname, 'module');
const module = pool.module(specifier);
```

To add TypeScript support, you can use the `typed()` method:

```ts
const typed = module.typed<typeof import('./module')>();
```

This will create a type-safe wrapper, which knows the types of the exported
functions. You can now call the exported functions from the module in one of the
following ways:

#### Using the `.exec()` method

This will execute the function in one of the threads in the thread pool and
return the result as a promise.

```ts
const result = await typed.exec('add', [1, 2]); // 3
```

#### Using the `.ch()` method

Every function call creates a channel, which is a duplex stream (more on that
later). By calling the `.ch()` method, you can get a reference to the channel.

You can get the final result of the function call from the `.result` promise:

```ts
const result = await typed.ch('add', [1, 2]).result; // 3
```


#### Using the `.api()` builder

You can construct an "API" object of your module using the `.api()` method.

```ts
const api = typed.api();
```

This returns an object of all the exported functions, which you can call:

```ts
const result = await api.add(1, 2).result; // 3
```


#### Using the `.fn()` closure

To use this method you need to make sure that you module is loaded in at least
one thread. You can achieve that by calling the `module.init()` method.

```ts
await module.init();
```

Now you can create a closure for you function

```ts
const add = typed.fn('add');
```

and run it as a function (it returns a channel)

```ts
const result = await add(1, 2).result; // 3
```


### Single function modules

The `fun()` method will create a module out of a single function and load it in
the main thread pool.

```ts
import {fun} from 'node-multicore';

const fn = fun((a: number, b: number) => a + b);

const result = await fn(1, 2); // 3
```

Note, when using the `fun()` method do not get access to the underlying channel
and you can specify all function arguments in function call `fn(1, 2)` instead of
as an array `fn([1, 2])`.

Under the hood, the `fun()` method creates a module with a single function. You
can achieve that manually as well:

```ts
const module = pool.fun((a: number, b: number) => a + b);
```

Now the `module` object is just like any other module, the single function is
exported as `default`.

Note, you function cannot access any variables outside of its scope.


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

Load it using the `pool.cjs()` method:

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


### *Module Expressions*

[ECMAScript *Module Expressions*](https://github.com/tc39/proposal-module-expressions)
proposal will allow to create anonymous modules at runtime, which can then be
copied to other threads. This library will support this proposal once it is
implemented in Node.js.


## Module exports

Modules are loaded in worker threads and their exports become available in the
main thread. Below we describe how different types of exports are handled.


### Functions

The most common export is a function, which receives a single "payload" argument.
The function can be async as well as synchronous. The return value of the function
is sent back to the main thread.

```ts
import {WorkerFn} from 'node-multicore';

export const add: WorkerFn<[a: number, b: number], number> = ([a, b]) => {
  return a + b;
};
```


### Channels

Channels are functions, which accept 2 or 3 arguments. The first argument is a
"payload" argument, which is the same as for regular functions. The next two
arguments are "send" and "receive" methods, which can be used to send and receive
data from the main thread.

```ts
import {WorkerCh, taker} from 'node-multicore';

export const addThreeNumbers: WorkerCh<number, number, number, void> = async (one, send, recv) => {
  const take = taker(recv);
  const two = await take();
  const three = await take();
  return one + two + three;
};
```

The channel is open until the function returns. You can use the `taker()` helper
to create a function, which will wait for the next value from the channel.


### Promises

If module exports a promise, when called from the main thread the promise will
be resolved first and then: (1) if the promise resolves to a function, the
function will be called with the payload argument, (2) if the promise resolves
to anything else, the value will be returned.


### Other exports

All other exports are returned to the main thread as is, using the `postMessage`
copy algorithm.


## Advanced topics

### Pinning a thread

Sometimes your threads need to share state. In that case you may want to pin
a series of module calls to the same thread. You can do that by calling the
`pinned()` method on a module.

```ts
const pinned = module.pinned();
```

Then use the `pinned` object to call the module functions:

```ts
const result = await pinned.ch('add', [1, 2]).result;
``` 

All calls through the `pinned` instance will be executed on the same thread.


### Transferring data by ownership

When you are sending data between threads, the most efficient way is to transfer
ownership of the data. You can do that using the `ArrayBuffer` objects. This way
the data will not be copied, but instead the buffers will be truncated in the
current thread and become available in the new thread.

Transfer buffers when executing a function:

```ts
module.exec('fn', params, [buffer1, buffer2, buffer3]);
```

Transfers buffers when writing to a channel from the main thread:

```ts
const channel = module.ch('fn', params, [buffer1, buffer2, buffer3]);

channel.send(123, [buffer4, buffer5, buffer6]);
```

Transfer buffers when returning a value using the `msg` helper:

```ts
import {msg} from 'node-multicore';

export const add = ([a: number, b: number]) => {
  return msg(a + b, [buffer1, buffer2, buffer3]);
};
```

Transfer buffers when writing to a channel from a worker thread:

```ts
export const method = (params, send, recv) => {
  send(123, [buffer1, buffer2, buffer3]);
  send(456, [buffer4, buffer5, buffer6]);
  return 123;
};
```


## Demo / Benchmark

Run a demo with the following commands:

```bash
yarn
yarn demo
```

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
