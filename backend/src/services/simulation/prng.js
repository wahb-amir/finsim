"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toCommonJS = (mod) =>
  __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var prng_exports = {};
__export(prng_exports, {
  createRng: () => createRng,
  hashSeed: () => hashSeed,
});
module.exports = __toCommonJS(prng_exports);
function createRng(seed) {
  let t = seed >>> 0;
  const next = () => {
    t += 1831565813;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(minInclusive, maxInclusive) {
      const min = Math.ceil(minInclusive);
      const max = Math.floor(maxInclusive);
      if (max < min) throw new Error("RNG.int: invalid range");
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(arr) {
      if (arr.length === 0) throw new Error("RNG.pick: empty array");
      return arr[Math.floor(next() * arr.length)];
    },
  };
}
function hashSeed(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    createRng,
    hashSeed,
  });
