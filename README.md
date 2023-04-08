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
CPU = AMD Ryzen 9 3900X 12-Core Processor, Cores = 24, Max threads = 23, Node = v18.13.0, Arch = x64, OS = linux
Warmup ...
On main thread (concurrency = 1): 7.290s
On main thread (concurrency = 10): 7.216s
Thread pool: node-multicore (concurrency = 1): 8.587s
Thread pool: piscina (concurrency = 1): 8.459s
Thread pool: worker-nodes (concurrency = 1): 9.388s
Thread pool: node-multicore (concurrency = 2): 4.337s
Thread pool: piscina (concurrency = 2): 4.411s
Thread pool: worker-nodes (concurrency = 2): 4.754s
Thread pool: node-multicore (concurrency = 3): 2.982s
Thread pool: piscina (concurrency = 3): 2.885s
Thread pool: worker-nodes (concurrency = 3): 3.014s
Thread pool: node-multicore (concurrency = 4): 2.200s
Thread pool: piscina (concurrency = 4): 2.155s
Thread pool: worker-nodes (concurrency = 4): 2.226s
Thread pool: node-multicore (concurrency = 5): 1.760s
Thread pool: piscina (concurrency = 5): 1.757s
Thread pool: worker-nodes (concurrency = 5): 1.795s
Thread pool: node-multicore (concurrency = 6): 1.593s
Thread pool: piscina (concurrency = 6): 1.518s
Thread pool: worker-nodes (concurrency = 6): 1.538s
Thread pool: node-multicore (concurrency = 7): 1.317s
Thread pool: piscina (concurrency = 7): 1.297s
Thread pool: worker-nodes (concurrency = 7): 1.309s
Thread pool: node-multicore (concurrency = 10): 964.902ms
Thread pool: piscina (concurrency = 10): 943.783ms
Thread pool: worker-nodes (concurrency = 10): 937.609ms
Thread pool: node-multicore (concurrency = 25): 714.063ms
Thread pool: piscina (concurrency = 25): 998.225ms
Thread pool: worker-nodes (concurrency = 25): 649.39ms
Thread pool: node-multicore (concurrency = 100): 802.928ms
Thread pool: piscina (concurrency = 100): 988.43ms
Thread pool: worker-nodes (concurrency = 100): 684.257ms
Thread pool: node-multicore (concurrency = 500): 793.03ms
Thread pool: piscina (concurrency = 500): 741.733ms
Thread pool: worker-nodes (concurrency = 500): 670.278ms
```
