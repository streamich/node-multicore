# Node Multicore

Multicore programming for Node.js made simple. Make any CommonJs or ESM module
run in a thread pool.

1. A shared thread pool, designed to be shared across all NPM packages. But
   custom thread pools can be created as well.
1. Dynamic thread pool. It starts from 0 threads and scales up to the number of
   CPU cores as the load increases.
1. Dynamically load (and potentially unload) modules in the thread pool. Module
   concurrency is dynamic as well, initially a module is not loaded in the in
   any thread, but as the load increases it will be loaded in increasingly more
   threads.
1. Dead threads are automatically removed from the pool.


## Usage

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


## Demo

Run a demo with the following commands:

```bash
yarn
yarn demo
```

The demo executes this [`work` function](demo/module.js) on a single core vs.
in the thread pool. The results are printed to the console.

Sample output:

```
CPU = Apple M1 Max, Cores = 10, Max threads = 9
Warmup ...
On main thread (concurrency = 1): 9.645s
On main thread (concurrency = 10): 9.462s
Thread pool: node-multicore (concurrency = 1): 9.800s
Thread pool: piscina (concurrency = 1): 9.704s
Thread pool: node-multicore (concurrency = 2): 4.999s
Thread pool: piscina (concurrency = 2): 4.988s
Thread pool: node-multicore (concurrency = 3): 3.402s
Thread pool: piscina (concurrency = 3): 3.393s
Thread pool: node-multicore (concurrency = 4): 2.540s
Thread pool: piscina (concurrency = 4): 2.539s
Thread pool: node-multicore (concurrency = 5): 2.053s
Thread pool: piscina (concurrency = 5): 2.043s
Thread pool: node-multicore (concurrency = 6): 1.724s
Thread pool: piscina (concurrency = 6): 1.738s
Thread pool: node-multicore (concurrency = 7): 1.492s
Thread pool: piscina (concurrency = 7): 1.501s
Thread pool: node-multicore (concurrency = 10): 1.245s
Thread pool: piscina (concurrency = 10): 1.276s
Thread pool: node-multicore (concurrency = 25): 1.212s
Thread pool: piscina (concurrency = 25): 1.278s
Thread pool: node-multicore (concurrency = 100): 1.224s
Thread pool: piscina (concurrency = 100): 1.276s
Thread pool: node-multicore (concurrency = 500): 1.293s
Thread pool: piscina (concurrency = 500): 1.282s
✨  Done in 83.16s.
```
