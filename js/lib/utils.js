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
/*
export const getTopMaxes = (arr) => {
  let threshold = -Infinity;
  let len = arr.length;

  let topten = arr.slice(0, 10).sort((a, b) => b - a);
  let minMax = arr[9];

  while(len-- > 10) {
    if (arr[len] > minMax) {
      for (let i = 0; i < 10; i++) {
        if (arr[len] > topten[i]) {
          topten.splice(i, 0, arr[len]);
          topten.splice(10);
          minMax = topten[9];
        }
      }
    }
  }

  return topten;
}
*/
export const createSvgElement = (type, attributes) => {
  const xmlns = 'http://www.w3.org/2000/svg';
  let el = document.createElementNS(xmlns, type);
  Object.keys(attributes)
    .forEach(attrib => {
      const svgAttrib = attrib.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
      el.setAttribute(svgAttrib, attributes[attrib]);
    });

  return el;
}
