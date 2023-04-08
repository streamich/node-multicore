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


## Demo/Benchmark

Run a demo with the following commands:

```bash
yarn
yarn demo
```

The demo executes this [`work` function](demo/module.js) on a single core vs.
in the thread pool. The results are printed to the console.

Sample output:

```
CPU = Apple M1 Max, Cores = 10, Max threads = 9, Node = v16.19.1, Arch = arm64, OS = darwin
Warmup ...
Thread pool: node-multicore (concurrency = 2): 5.014s
Thread pool: piscina (concurrency = 2): 4.997s
Thread pool: worker-nodes (concurrency = 2): 5.005s
Thread pool: node-multicore (concurrency = 4): 2.567s
Thread pool: piscina (concurrency = 4): 2.564s
Thread pool: worker-nodes (concurrency = 4): 2.562s
Thread pool: node-multicore (concurrency = 8): 1.333s
Thread pool: piscina (concurrency = 8): 1.355s
Thread pool: worker-nodes (concurrency = 8): 1.359s
Thread pool: node-multicore (concurrency = 16): 1.205s
Thread pool: piscina (concurrency = 16): 1.298s
Thread pool: worker-nodes (concurrency = 16): 1.285s
Thread pool: node-multicore (concurrency = 32): 1.192s
Thread pool: piscina (concurrency = 32): 1.293s
Thread pool: worker-nodes (concurrency = 32): 1.305s
Thread pool: node-multicore (concurrency = 64): 1.192s
Thread pool: piscina (concurrency = 64): 1.290s
Thread pool: worker-nodes (concurrency = 64): 1.286s
Thread pool: node-multicore (concurrency = 128): 1.203s
Thread pool: piscina (concurrency = 128): 1.292s
Thread pool: worker-nodes (concurrency = 128): 1.279s
Thread pool: node-multicore (concurrency = 256): 1.186s
Thread pool: piscina (concurrency = 256): 1.296s
Thread pool: worker-nodes (concurrency = 256): 1.275s
Thread pool: node-multicore (concurrency = 512): 1.182s
Thread pool: piscina (concurrency = 512): 1.302s
Thread pool: worker-nodes (concurrency = 512): 1.273s
Thread pool: node-multicore (concurrency = 1024): 1.183s
Thread pool: piscina (concurrency = 1024): 1.301s
Thread pool: worker-nodes (concurrency = 1024): 1.272s
Thread pool: node-multicore (concurrency = 1): 9.655s
Thread pool: piscina (concurrency = 1): 9.707s
Thread pool: worker-nodes (concurrency = 1): 9.838s
On main thread (concurrency = 1): 9.666s
On main thread (concurrency = 10): 9.437s
```
