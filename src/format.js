// Number formats of Serenity chapter 02 § Content formatting: two decimals, thousands separators, the code after the amount.
export const fmt = (n) => Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const signed = (n) => (n < 0 ? '−' : '+') + fmt(n);
export const compactK = (n) => (n / 1000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'K';
export const pct = (part, whole) => `${Math.round((part / whole) * 100)}%`;
