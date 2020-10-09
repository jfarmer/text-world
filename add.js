function double(q, work) {
  return 2 * work(q);
}

function add(x, y) {
  return x + y;
}

let woof = 100;
function whatever(z) {
  return add(woof, z);
}

let result = double(10, whatever);

console.log(result);
