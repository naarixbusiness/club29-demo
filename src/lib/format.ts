export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
export const inrShort = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(n >= 1e6 ? 1 : 2)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}k`;
  return inr(n);
};
export const count = (n: number) => n.toLocaleString('en-IN');
export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
export const initials = (name: string) => name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
export const plural = (n: number, one: string, many = one + 's') => `${count(n)} ${n === 1 ? one : many}`;
