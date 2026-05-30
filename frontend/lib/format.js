export function formatCurrency(n = 0) {
  const value = Number(n) || 0;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toLocaleString()}`;
}

export function prettifyLabel(label) {
  if (!label) return "Unknown";
  return String(label)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
