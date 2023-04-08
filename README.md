# Node Multicore

Multicore programming for Node.js made simple.


## Usage

Create a module you want to be loaded in the thread pool, put it in a `module.ts` file:

```ts
export const add = ([a, b]) => a + b;
```

Now add your module in the thread pool:

```ts
import {pool} from 'node-multicore';

const module = pool.addModule(__dirname + '/module');
```

You can now call the exported functions from the module:

```ts
const result = await module.exec([1, 2]); // 3
```


## Demo

Run a demo with the following commands:

```bash
yarn
yarn demo
```

The demo executes this [`work` function](demo/module.js) on a single core vs.
multiple cores. The results are printed to the console.
