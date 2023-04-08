# Node Multicore

Multicore programming for Node.js made simple.


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
CPU = Apple M1, Cores = 8, Max threads = 7
On main thread (concurrency = 1): 10.360s
On main thread (concurrency = 10): 10.163s
Thread pool: multicore (concurrency = 1): 10.812s
Thread pool: piscina (concurrency = 1): 11.082s
Thread pool: multicore (concurrency = 2): 5.758s
Thread pool: piscina (concurrency = 2): 5.714s
Thread pool: multicore (concurrency = 3): 4.082s
Thread pool: piscina (concurrency = 3): 3.970s
Thread pool: multicore (concurrency = 4): 3.266s
Thread pool: piscina (concurrency = 4): 3.409s
Thread pool: multicore (concurrency = 5): 2.999s
Thread pool: piscina (concurrency = 5): 3.110s
Thread pool: multicore (concurrency = 6): 2.720s
Thread pool: piscina (concurrency = 6): 2.444s
Thread pool: multicore (concurrency = 7): 2.188s
Thread pool: piscina (concurrency = 7): 2.147s
Thread pool: multicore (concurrency = 10): 2.066s
Thread pool: piscina (concurrency = 10): 2.334s
Thread pool: multicore (concurrency = 25): 1.952s
Thread pool: piscina (concurrency = 25): 2.242s
Thread pool: multicore (concurrency = 100): 1.973s
Thread pool: piscina (concurrency = 100): 2.191s
Thread pool: multicore (concurrency = 500): 1.966s
Thread pool: piscina (concurrency = 500): 2.179s
✨  Done in 102.82s.
```
