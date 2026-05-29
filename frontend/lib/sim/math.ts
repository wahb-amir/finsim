export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function compound({
  principal,
  annualRate,
  compoundsPerYear,
  years,
}: {
  principal: number;
  annualRate: number; // e.g. 0.07
  compoundsPerYear: number; // e.g. 12
  years: number;
}): number {
  // A = P (1 + r/n)^(nt)
  const r = annualRate;
  const n = compoundsPerYear;
  const t = years;
  return principal * Math.pow(1 + r / n, n * t);
}

export function paymentAmortized({
  principal,
  annualRate,
  termMonths,
}: {
  principal: number;
  annualRate: number; // nominal APR, e.g. 0.069
  termMonths: number;
}): number {
  // Standard fixed-rate amortization payment:
  // PMT = P * i / (1 - (1+i)^-N), where i = r/12
  if (termMonths <= 0) return principal;
  const i = annualRate / 12;
  if (Math.abs(i) < 1e-10) return principal / termMonths;
  const denom = 1 - Math.pow(1 + i, -termMonths);
  return principal * (i / denom);
}

export function stepAmortization({
  balance,
  annualRate,
  payment,
}: {
  balance: number;
  annualRate: number;
  payment: number;
}): { interestPaid: number; principalPaid: number; nextBalance: number } {
  const i = annualRate / 12;
  const interest = balance * i;
  const principalPaid = Math.max(0, payment - interest);
  const nextBalance = Math.max(0, balance - principalPaid);
  return { interestPaid: interest, principalPaid, nextBalance };
}

export type TaxBracket = { upTo: number; rate: number }; // upTo in annual dollars; last can be Infinity

export function taxAnnual({
  taxableIncome,
  brackets,
}: {
  taxableIncome: number;
  brackets: readonly TaxBracket[];
}): number {
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
