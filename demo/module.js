exports.work = async () => {
  await new Promise(setImmediate);
  let cnt = 0;
  for (let i = 0; i < 1000000; i++) cnt += i;
  return cnt;
};
