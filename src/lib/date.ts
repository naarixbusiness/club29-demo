// The demo runs on a fixed "today" so every number in the design lines up.
export const TODAY = new Date(2026, 8, 24, 11, 40); // Thu 24 Sep 2026, 11:40 AM
export const DAY = 86_400_000;

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate(), d.getHours(), d.getMinutes());
export const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);
export const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

export const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${MON[d.getMonth()]} ${d.getFullYear()}`;
export const fmtShort = (d: Date) => `${d.getDate()} ${MON[d.getMonth()]}`;
export const fmtMonth = (d: Date) => `${MON[d.getMonth()]} ${d.getFullYear()}`;
export const monthName = (m: number) => MON[((m % 12) + 12) % 12];
export const weekday = (d: Date) => WD[d.getDay()];
export const fmtTime = (d: Date) => {
  const h = d.getHours(), m = d.getMinutes();
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
export const fmtDuration = (min: number) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`);
export const relTime = (d: Date, now = TODAY) => {
  const m = Math.round((now.getTime() - d.getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)} hr ago`;
  return fmtShort(d);
};
