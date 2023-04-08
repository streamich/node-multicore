import {pool} from './singleton';
import {WorkerFn} from './worker/types';

export const fun = <Args extends any[], Res>(fn: (...args: Args) => Res) => {
  const text = fn.toString();
  const wrapper = new Function('args', `return (${text}).apply(null, args)`) as WorkerFn<Args, any>;
  const module = pool.fun(wrapper);
  return (...args: Args): Res => module.exec('default', args) as Res;
};
