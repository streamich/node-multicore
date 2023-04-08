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

Running "On main thread" case (concurrency = 1) ...
Result: OK
Time: 10.446s

Running "On main thread" case (concurrency = 10) ...
Result: OK
Time: 10.167s

Running "In thread pool" case (concurrency = 1) ...
Result: OK
Time: 10.586s

Running "In thread pool" case (concurrency = 2) ...
Result: OK
Time: 5.366s

Running "In thread pool" case (concurrency = 3) ...
Result: OK
Time: 3.775s

Running "In thread pool" case (concurrency = 4) ...
Result: OK
Time: 3.188s

Running "In thread pool" case (concurrency = 5) ...
Result: OK
Time: 2.622s

Running "In thread pool" case (concurrency = 6) ...
Result: OK
Time: 2.354s

Running "In thread pool" case (concurrency = 7) ...
Result: OK
Time: 2.227s

Running "In thread pool" case (concurrency = 10) ...
Result: OK
Time: 2.086s

Running "In thread pool" case (concurrency = 25) ...
Result: OK
Time: 1.902s

Running "In thread pool" case (concurrency = 100) ...
Result: OK
Time: 1.804s

Running "In thread pool" case (concurrency = 500) ...
Result: OK
Time: 1.796s
✨  Done in 59.66s.
```
