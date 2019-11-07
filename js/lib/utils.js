export const getMax = (arr) =>
  arr.reduce((max, entry) =>
    entry > max ? entry : max);

export const getMin = (arr) =>
  arr.reduce((min, entry) =>
    entry < min ? entry : min);

export const getMinMax = (arr) => {
  let min = Infinity, max = -Infinity;
  let len = arr.length;

  while(len--) {
    if (arr[len] > max) max = arr[len];
    if (arr[len] < min) min = arr[len];
  }

  return [ min, max ];
}
