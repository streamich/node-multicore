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
On main thread (concurrency = 1): 9.542s
On main thread (concurrency = 10): 9.396s
Thread pool: node-multicore (concurrency = 1): 9.666s
Thread pool: piscina (concurrency = 1): 9.634s
Thread pool: worker-nodes (concurrency = 1): 9.673s
Thread pool: node-multicore (concurrency = 2): 4.957s
Thread pool: piscina (concurrency = 2): 4.968s
Thread pool: worker-nodes (concurrency = 2): 4.969s
Thread pool: node-multicore (concurrency = 3): 3.385s
Thread pool: piscina (concurrency = 3): 3.397s
Thread pool: worker-nodes (concurrency = 3): 3.407s
Thread pool: node-multicore (concurrency = 4): 2.551s
Thread pool: piscina (concurrency = 4): 2.554s
Thread pool: worker-nodes (concurrency = 4): 2.556s
Thread pool: node-multicore (concurrency = 5): 2.060s
Thread pool: piscina (concurrency = 5): 2.049s
Thread pool: worker-nodes (concurrency = 5): 2.061s
Thread pool: node-multicore (concurrency = 6): 1.734s
Thread pool: piscina (concurrency = 6): 1.745s
Thread pool: worker-nodes (concurrency = 6): 1.734s
Thread pool: node-multicore (concurrency = 7): 1.502s
Thread pool: piscina (concurrency = 7): 1.510s
Thread pool: worker-nodes (concurrency = 7): 1.500s
Thread pool: node-multicore (concurrency = 10): 1.252s
Thread pool: piscina (concurrency = 10): 1.291s
Thread pool: worker-nodes (concurrency = 10): 1.282s
Thread pool: node-multicore (concurrency = 25): 1.186s
Thread pool: piscina (concurrency = 25): 1.300s
Thread pool: worker-nodes (concurrency = 25): 1.266s
Thread pool: node-multicore (concurrency = 100): 1.186s
Thread pool: piscina (concurrency = 100): 1.308s
Thread pool: worker-nodes (concurrency = 100): 1.276s
Thread pool: node-multicore (concurrency = 500): 1.177s
Thread pool: piscina (concurrency = 500): 1.309s
Thread pool: worker-nodes (concurrency = 500): 1.271s
```
