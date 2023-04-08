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
On main thread (concurrency = 1): 9.553s
On main thread (concurrency = 10): 9.405s
Thread pool: node-multicore (concurrency = 1): 9.663s
Thread pool: piscina (concurrency = 1): 9.631s
Thread pool: worker-nodes (concurrency = 1): 9.675s
Thread pool: node-multicore (concurrency = 2): 4.955s
Thread pool: piscina (concurrency = 2): 4.973s
Thread pool: worker-nodes (concurrency = 2): 4.973s
Thread pool: node-multicore (concurrency = 3): 3.388s
Thread pool: piscina (concurrency = 3): 3.395s
Thread pool: worker-nodes (concurrency = 3): 3.403s
Thread pool: node-multicore (concurrency = 4): 2.550s
Thread pool: piscina (concurrency = 4): 2.562s
Thread pool: worker-nodes (concurrency = 4): 2.559s
Thread pool: node-multicore (concurrency = 5): 2.061s
Thread pool: piscina (concurrency = 5): 2.055s
Thread pool: worker-nodes (concurrency = 5): 2.064s
Thread pool: node-multicore (concurrency = 6): 1.735s
Thread pool: piscina (concurrency = 6): 1.744s
Thread pool: worker-nodes (concurrency = 6): 1.737s
Thread pool: node-multicore (concurrency = 7): 1.497s
Thread pool: piscina (concurrency = 7): 1.524s
Thread pool: worker-nodes (concurrency = 7): 1.497s
Thread pool: node-multicore (concurrency = 10): 1.250s
Thread pool: piscina (concurrency = 10): 1.297s
Thread pool: worker-nodes (concurrency = 10): 1.283s
Thread pool: node-multicore (concurrency = 25): 1.200s
Thread pool: piscina (concurrency = 25): 1.308s
Thread pool: worker-nodes (concurrency = 25): 1.272s
Thread pool: node-multicore (concurrency = 100): 1.182s
Thread pool: piscina (concurrency = 100): 1.291s
Thread pool: worker-nodes (concurrency = 100): 1.271s
Thread pool: node-multicore (concurrency = 500): 1.195s
Thread pool: piscina (concurrency = 500): 1.309s
Thread pool: worker-nodes (concurrency = 500): 1.276s
```
