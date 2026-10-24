/* ============================================================
   RNG.JS — детерминированный генератор случайных чисел
   ------------------------------------------------------------
   Сид хранится в GAME.meta.seed. Сохранение воспроизводит броски.
   ============================================================ */

const RNG = {
  _seed: 1,

  setSeed(s){
    this._seed = (s >>> 0) || 1;
  },

  getSeed(){
    return this._seed >>> 0;
  },

  _next(){
    // xorshift32
    let x = this._seed;
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;  x >>>= 0;
    this._seed = x || 1;
    return this._seed;
  },

  int(min, max){
    return min + (this._next() % (max - min + 1));
  },

  die(sides = 20){
    return this.int(1, sides);
  },

  chance(p){
    return (this._next() % 1000) / 1000 < p;
  },

  pick(arr){
    return arr[this.int(0, arr.length - 1)];
  }
};

function randInt(min,max){ return RNG.int(min,max); }
function rollDie(sides=20){ return RNG.die(sides); }
