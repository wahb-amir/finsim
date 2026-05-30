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
var math_exports = {};
__export(math_exports, {
  clamp: () => clamp,
  compound: () => compound,
  paymentAmortized: () => paymentAmortized,
  round2: () => round2,
  stepAmortization: () => stepAmortization,
  taxAnnual: () => taxAnnual,
});
module.exports = __toCommonJS(math_exports);
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function round2(n) {
  return Math.round(n * 100) / 100;
}
function compound({ principal, annualRate, compoundsPerYear, years }) {
  const r = annualRate;
  const n = compoundsPerYear;
  const t = years;
  return principal * Math.pow(1 + r / n, n * t);
}
function paymentAmortized({ principal, annualRate, termMonths }) {
  if (termMonths <= 0) return principal;
  const i = annualRate / 12;
  if (Math.abs(i) < 1e-10) return principal / termMonths;
  const denom = 1 - Math.pow(1 + i, -termMonths);
  return principal * (i / denom);
}
function stepAmortization({ balance, annualRate, payment }) {
  const i = annualRate / 12;
  const interest = balance * i;
  const principalPaid = Math.max(0, payment - interest);
  const nextBalance = Math.max(0, balance - principalPaid);
  return { interestPaid: interest, principalPaid, nextBalance };
}
function taxAnnual({ taxableIncome, brackets }) {
  const income = Math.max(0, taxableIncome);
  let remaining = income;
  let lastCap = 0;
  let tax = 0;
  for (const b of brackets) {
    const cap = b.upTo;
    const span = Math.max(0, Math.min(remaining, cap - lastCap));
    tax += span * b.rate;
    remaining -= span;
    lastCap = cap;
    if (remaining <= 0) break;
  }
  return tax;
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    clamp,
    compound,
    paymentAmortized,
    round2,
    stepAmortization,
    taxAnnual,
  });
