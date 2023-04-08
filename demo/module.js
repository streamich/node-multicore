exports.loop = async (iterations = 1000000) => {
  await new Promise(setImmediate);
  let cnt = 0;
  for (let i = 0; i < iterations; i++) cnt += i;
  return cnt;
};

exports.json = async (iterations = 1000) => {
  await new Promise(setImmediate);
  const map = {};
  for (let i = 0; i < iterations; i++) map[i] = i;
  return JSON.stringify(map);
};
