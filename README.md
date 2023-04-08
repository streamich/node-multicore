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
On main thread (concurrency = 1): 10.465s
On main thread (concurrency = 10): 10.154s
Thread pool: multicore (concurrency = 1): 10.582s
Thread pool: piscina (concurrency = 1): 10.492s
Thread pool: multicore (concurrency = 2): 5.444s
Thread pool: piscina (concurrency = 2): 5.283s
Thread pool: multicore (concurrency = 3): 3.805s
Thread pool: piscina (concurrency = 3): 3.673s
Thread pool: multicore (concurrency = 4): 3.239s
Thread pool: piscina (concurrency = 4): 3.134s
Thread pool: multicore (concurrency = 5): 2.644s
Thread pool: piscina (concurrency = 5): 2.651s
Thread pool: multicore (concurrency = 6): 2.366s
Thread pool: piscina (concurrency = 6): 2.387s
Thread pool: multicore (concurrency = 7): 2.230s
Thread pool: piscina (concurrency = 7): 2.227s
Thread pool: multicore (concurrency = 10): 2.072s
Thread pool: piscina (concurrency = 10): 2.221s
Thread pool: multicore (concurrency = 25): 1.891s
Thread pool: piscina (concurrency = 25): 2.227s
Thread pool: multicore (concurrency = 100): 1.817s
Thread pool: piscina (concurrency = 100): 2.223s
Thread pool: multicore (concurrency = 500): 1.827s
Thread pool: piscina (concurrency = 500): 2.214s
✨  Done in 98.75s.
```
