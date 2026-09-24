// Builds the Club29 mock gym: 1,248 members plus their invoices, today's check-ins,
// leads, trainer sessions and activity. Deterministic — same data on every load.
import { rng } from '../lib/rng';
import { TODAY, addDays, addMonths, daysBetween, startOfDay } from '../lib/date';
import { FEMALE, MALE, PLANS, SURNAMES, TRAINERS } from './catalog';
import type { Activity, CheckIn, Invoice, Lead, LeadSource, LeadStage, Measurement, Member, Method, Session } from './types';

const R = rng(29);
const at = (y: number, m: number, d: number, h = 9, min = 0) => new Date(y, m - 1, d, h, min);
const planById = (id: string) => PLANS.find((p) => p.id === id)!;
const TID = TRAINERS.map((t) => t.id);

function phone() {
  return `+91 ${R.pick(['98', '99', '97', '90', '93', '88', '70', '79', '96'])}${R.int(100, 999)} ${R.int(10000, 99999)}`;
}
function email(first: string, last: string) {
  const dom = R.weighted([['gmail.com', 7], ['outlook.com', 1], ['yahoo.in', 1]] as const);
  return `${first}.${last}${R.chance(0.35) ? R.int(1, 99) : ''}@${dom}`.toLowerCase();
}
function method(): Method {
  return R.weighted([['UPI', 62], ['Card', 18], ['Cash', 11], ['Online', 9]] as const);
}
function visitDaysFor(n: number, seedDays?: number[]): number[] {
  if (seedDays) return seedDays;
  const today = TODAY.getDate();
  const pool = Array.from({ length: today }, (_, i) => i + 1).sort(() => R.next() - 0.5);
  return pool.slice(0, Math.min(n, today)).sort((a, b) => a - b);
}
function measurements(gender: 'Male' | 'Female', height: number, since: Date): Measurement[] {
  const base = gender === 'Male' ? R.int(66, 92) : R.int(52, 76);
  const trend = R.pick([-0.5, -0.35, -0.2, 0.1, 0.25]);
  const bf0 = gender === 'Male' ? R.int(17, 28) : R.int(24, 34);
  const out: Measurement[] = [];
  const months = Math.max(1, Math.min(12, Math.floor(daysBetween(since, TODAY) / 30)));
  for (let i = months; i >= 0; i -= Math.max(1, Math.floor(months / 4))) {
    const k = months - i;
    const w = +(base + trend * k).toFixed(1);
    out.push({ date: addDays(TODAY, -i * 30), weight: w, bodyFat: +(bf0 + trend * 0.6 * k).toFixed(1), waist: Math.round((gender === 'Male' ? 86 : 76) + trend * 1.1 * k), chest: gender === 'Male' ? 98 + Math.round(k / 3) : 88, arms: gender === 'Male' ? 33 + Math.round(k / 5) : 28 });
  }
  if (out.length === 1) out.unshift({ ...out[0], date: since });
  void height;
  return out;
}

type Seed = {
  name: string; id: string; phone: string; email: string; gender: 'Male' | 'Female'; plan: string; label?: string;
  trainer?: string; start: Date; join: Date; visits: number; autopay?: boolean; days?: number[]; pt?: [number, number];
};

// The 10 members the design shows by name.
const FEATURED: Seed[] = [
  { name: 'Rahul Mehta', id: 'C29-1042', phone: '+91 98250 41236', email: 'rahul.mehta@gmail.com', gender: 'Male', plan: 'annual', label: 'Annual + PT', trainer: 't-john', start: at(2025, 10, 24), join: at(2024, 10, 24), visits: 18, days: [1, 2, 3, 5, 7, 8, 9, 10, 12, 14, 15, 16, 17, 19, 21, 22, 23, 24], pt: [9, 12] },
  { name: 'Priya Shah', id: 'C29-1318', phone: '+91 99090 17452', email: 'priya.shah@outlook.com', gender: 'Female', plan: 'monthly', trainer: 't-aisha', start: at(2026, 9, 24, 9, 46), join: at(2026, 9, 24), visits: 1 },
  { name: 'Amit Patel', id: 'C29-0987', phone: '+91 97129 55083', email: 'amitpatel88@gmail.com', gender: 'Male', plan: 'half', trainer: 't-rohit', start: at(2026, 4, 12), join: at(2025, 4, 12), visits: 15 },
  { name: 'Neha Desai', id: 'C29-1175', phone: '+91 98980 62214', email: 'neha.desai@gmail.com', gender: 'Female', plan: 'quarterly', label: 'Quarterly + PT', trainer: 't-john', start: at(2026, 6, 26), join: at(2026, 3, 26), visits: 11, pt: [3, 8] },
  { name: 'Arjun Shah', id: 'C29-1203', phone: '+91 90990 38817', email: 'arjun.s@yahoo.in', gender: 'Male', plan: 'monthly', start: at(2026, 8, 27), join: at(2026, 4, 27), visits: 9 },
  { name: 'Kavya Iyer', id: 'C29-1099', phone: '+91 98241 70326', email: 'kavya.iyer@gmail.com', gender: 'Female', plan: 'half', trainer: 't-aisha', start: at(2026, 3, 29), join: at(2025, 9, 29), visits: 20 },
  { name: 'Vikram Singh', id: 'C29-0856', phone: '+91 99250 84410', email: 'vikram.singh@gmail.com', gender: 'Male', plan: 'monthly', trainer: 't-rohit', start: at(2026, 8, 22), join: at(2025, 1, 22), visits: 4 },
  { name: 'Sneha Kapoor', id: 'C29-0712', phone: '+91 98795 23109', email: 'sneha.kapoor@gmail.com', gender: 'Female', plan: 'annual', trainer: 't-meera', start: at(2025, 10, 1), join: at(2024, 10, 1), visits: 22, autopay: true },
  { name: 'Karan Malhotra', id: 'C29-0934', phone: '+91 90331 56720', email: 'karan.m@gmail.com', gender: 'Male', plan: 'quarterly', trainer: 't-john', start: at(2026, 9, 24, 10, 12), join: at(2025, 6, 24), visits: 16 },
  { name: 'Ishita Joshi', id: 'C29-1287', phone: '+91 97370 44981', email: 'ishita.joshi@gmail.com', gender: 'Female', plan: 'monthly', trainer: 't-meera', start: at(2026, 9, 10), join: at(2026, 7, 10), visits: 8 },
];

function toMember(s: Seed): Member {
  const plan = planById(s.plan);
  const expiry = addMonths(startOfDay(s.start), plan.months);
  const height = s.gender === 'Male' ? R.int(165, 185) : R.int(152, 170);
  const [ptUsed, ptTotal] = s.pt ?? (plan.ptSessions ? [R.int(0, plan.ptSessions), plan.ptSessions] : [0, 0]);
  const emergencyFirst = R.pick(s.gender === 'Male' ? FEMALE : MALE);
  return {
    id: s.id, name: s.name, phone: s.phone, email: s.email, gender: s.gender,
    dob: at(R.int(1982, 2004), R.int(1, 12), R.int(1, 28)), heightCm: height,
    joinDate: s.join, planId: s.plan, planLabel: s.label ?? plan.name, start: startOfDay(s.start), expiry,
    trainerId: s.trainer, visitsThisMonth: s.visits, visitDays: visitDaysFor(s.visits, s.days),
    totalVisits: Math.max(s.visits, Math.round(daysBetween(s.join, TODAY) * R.int(30, 55) / 100)),
    autopay: !!s.autopay,
    emergency: { name: `${emergencyFirst} ${s.name.split(' ')[1]}`, relation: R.pick(['Mother', 'Father', 'Spouse', 'Brother', 'Sister']), phone: phone() },
    programId: s.trainer ? R.pick(['p-muscle', 'p-fatloss', 'p-general', 'p-beginner']) : undefined,
    ptUsed, ptTotal,
    measurements: measurements(s.gender, height, s.join),
    notes: [],
  };
}

function buildMembers(): Member[] {
  const featured = FEATURED.map(toMember);
  // Rahul's profile is the one the design shows in detail.
  const rahul = featured[0];
  rahul.dob = at(1996, 3, 14); rahul.heightCm = 177; rahul.programId = 'p-muscle'; rahul.totalVisits = 214;
  rahul.emergency = { name: 'Sunita Mehta', relation: 'Mother', phone: '+91 98250 11870' };
  const W = [78.0, 77.4, 76.9, 76.5, 75.8, 75.1, 74.6, 74.2, 73.7, 73.4, 73.0, 72.4];
  const BF = [20.9, 20.4, 20.0, 19.6, 19.1, 18.7, 18.3, 17.9, 17.6, 17.3, 17.1, 16.8];
  rahul.measurements = W.map((w, i) => ({ date: at(2025, 10 + i > 12 ? i - 2 : 10 + i, i < 3 ? 20 : 20), weight: w, bodyFat: BF[i], waist: 88 - Math.round(i * 0.64), chest: 99 + Math.round(i / 4), arms: 34 + Math.round(i / 6) }));
  rahul.measurements.forEach((m, i) => { m.date = new Date(2025, 9 + i, 20); });
  rahul.notes = [
    { id: 'n1', at: at(2026, 9, 20, 18, 30), by: 'John Smith', text: 'Assessment done. Weight down 0.6 kg this month, bench up to 60 kg × 12. Moving to week 6.' },
    { id: 'n2', at: at(2026, 8, 3, 11, 0), by: 'Front desk', text: 'Asked about adding his brother on the Couple Annual plan at renewal.' },
  ];

  // Plan mix the gym reports: 318 Monthly, 296 Quarterly, 244 Half Yearly, 390 Annual.
  const want: Record<string, number> = { monthly: 318, quarterly: 296, half: 244, annual: 390 };
  featured.forEach((m) => { want[m.planId]--; });
  const planPool: string[] = Object.entries(want).flatMap(([p, n]) => Array(n).fill(p));
  const slots: string[] = [...Array(56).fill('expired'), ...Array(38).fill('expiring'), ...Array(85).fill('new')];
  while (slots.length < planPool.length) slots.push('active');
  planPool.sort(() => R.next() - 0.5);
  slots.sort(() => R.next() - 0.5);

  const used = new Set(featured.map((m) => m.id));
  const names = new Set(featured.map((m) => m.name));
  const members: Member[] = [...featured];
  planPool.forEach((planId, i) => {
    const plan = planById(planId);
    const gender = R.chance(0.58) ? 'Male' : 'Female';
    let name = '';
    do { name = `${R.pick(gender === 'Male' ? MALE : FEMALE)} ${R.pick(SURNAMES)}`; } while (names.has(name) && names.size < 1800);
    names.add(name);
    let id = '';
    do { id = `C29-${String(R.int(300, 1899)).padStart(4, '0')}`; } while (used.has(id));
    used.add(id);
    const slot = slots[i];
    let expiry: Date, start: Date, join: Date;
    if (slot === 'expired') {
      expiry = addDays(startOfDay(TODAY), -R.int(1, 30));
      start = addMonths(expiry, -plan.months);
      join = addDays(start, -R.int(0, 500));
    } else if (slot === 'expiring') {
      expiry = addDays(startOfDay(TODAY), R.int(0, 7));
      start = addMonths(expiry, -plan.months);
      join = addDays(start, -R.int(0, 600));
    } else if (slot === 'new') {
      start = at(2026, 9, R.int(5, 24), R.int(6, 20), R.int(0, 59));
      join = start;
      expiry = addMonths(startOfDay(start), plan.months);
    } else {
      const left = R.int(8, plan.months * 30 - 1);
      expiry = addDays(startOfDay(TODAY), left);
      start = addMonths(expiry, -plan.months);
      join = addDays(start, -R.int(0, 800));
      if (daysBetween(join, TODAY) <= 31) join = addDays(TODAY, -R.int(32, 400));
    }
    const first = name.split(' ')[0], last = name.split(' ')[1];
    const visits = slot === 'expired' ? R.int(0, 3) : slot === 'new' ? R.int(1, Math.max(1, daysBetween(start, TODAY) - 1)) : R.weighted([[R.int(2, 6), 2], [R.int(7, 12), 4], [R.int(13, 18), 4], [R.int(19, 23), 2]] as const);
    const hasTrainer = R.chance(0.375);
    const m = toMember({
      name, id, phone: phone(), email: email(first, last), gender, plan: planId,
      trainer: hasTrainer ? R.weighted([[TID[0], 30], [TID[1], 23], [TID[2], 27], [TID[3], 20]] as const) : undefined,
      start, join, visits: Math.min(visits, TODAY.getDate()), autopay: plan.months >= 6 && R.chance(0.2),
    });
    m.expiry = startOfDay(expiry);
    members.push(m);
  });
  return members;
}

export const seedMembers = buildMembers();

// ---------- invoices ----------
function buildInvoices(members: Member[]): Invoice[] {
  const list: Omit<Invoice, 'id'>[] = [];
  const priceOf = (m: Member) => (m.planLabel === 'Annual + PT' ? 29999 : m.planLabel === 'Quarterly + PT' ? 12499 : planById(m.planId).price);
  for (const m of members) {
    const plan = planById(m.planId);
    const paidAt = new Date(m.start.getFullYear(), m.start.getMonth(), m.start.getDate(), R.int(6, 20), R.int(0, 59));
    if (m.id === 'C29-1318') paidAt.setHours(9, 46);
    if (m.id === 'C29-0934') paidAt.setHours(10, 12);
    if (paidAt.getTime() > TODAY.getTime()) paidAt.setTime(TODAY.getTime() - R.int(5, 200) * 60000);
    list.push({ memberId: m.id, item: m.planLabel, amount: priceOf(m), method: m.autopay ? 'Card' : method(), date: paidAt, status: 'Paid' });
    const prevStart = addMonths(m.start, -plan.months);
    if (prevStart > m.joinDate || +prevStart === +m.joinDate) {
      if (daysBetween(prevStart, TODAY) < 400) list.push({ memberId: m.id, item: plan.name, amount: plan.price, method: method(), date: new Date(prevStart.getTime() + R.int(7, 19) * 3600000), status: 'Paid' });
    }
    const left = daysBetween(TODAY, m.expiry);
    if (left >= 0 && left <= 7 && !m.autopay && (R.chance(0.6) || ['C29-1175', 'C29-1203'].includes(m.id))) {
      list.push({ memberId: m.id, item: plan.name, amount: plan.price, method: null, date: addDays(TODAY, -R.int(0, 3)), status: 'Pending' });
    }
    if (left < 0 && (R.chance(0.7) || m.id === 'C29-0856')) {
      list.push({ memberId: m.id, item: plan.name, amount: plan.price, method: null, date: m.expiry, status: 'Overdue' });
    }
  }
  // A declined card from last night.
  const annual = members.find((m, i) => i > 20 && m.planId === 'annual' && daysBetween(TODAY, m.expiry) > 60)!;
  list.push({ memberId: annual.id, item: 'Annual', amount: 19999, method: 'Card', date: at(2026, 9, 23, 19, 5), status: 'Failed' });
  // PT add-on sold this morning.
  const pt = members.find((m, i) => i > 30 && m.trainerId === 't-john' && m.planId === 'quarterly')!;
  list.push({ memberId: pt.id, item: 'PT · 12 sessions', amount: 9999, method: 'Online', date: at(2026, 9, 24, 8, 20), status: 'Paid' });

  list.sort((a, b) => a.date.getTime() - b.date.getTime());
  const perYear: Record<number, number> = {};
  return list.map((inv) => {
    const y = inv.date.getFullYear();
    perYear[y] = (perYear[y] ?? 0) + 1;
    return { ...inv, id: `INV-${y}-${String(perYear[y]).padStart(4, '0')}` };
  }).reverse();
}
export const seedInvoices = buildInvoices(seedMembers);

// ---------- today's check-ins ----------
function buildCheckIns(members: Member[]): CheckIn[] {
  const fixed: [string, number, number, number | null, CheckIn['method']][] = [
    ['C29-1042', 10, 42, null, 'App QR'], ['C29-1099', 10, 31, null, 'App QR'], ['C29-0987', 10, 15, null, 'Front desk'],
    ['C29-0712', 9, 58, 64, 'App QR'], ['C29-0934', 9, 40, 56, 'App QR'], ['C29-1318', 9, 22, 68, 'Front desk'],
    ['C29-1287', 7, 5, 67, 'App QR'], ['C29-1175', 6, 48, 63, 'App QR'],
  ];
  const out: CheckIn[] = fixed.map(([id, h, m, dur, meth], i) => {
    const t = at(2026, 9, 24, h, m);
    return { id: `ci-${i}`, memberId: id, in: t, out: dur ? new Date(t.getTime() + dur * 60000) : undefined, method: meth };
  });
  const taken = new Set(out.map((c) => c.memberId));
  const pool = members.filter((m) => !taken.has(m.id) && m.expiry >= startOfDay(TODAY) && m.visitsThisMonth >= 8).sort(() => R.next() - 0.5);
  const hours: [number, number][] = [[5, 14], [6, 46], [7, 48], [8, 36], [9, 20], [10, 11], [11, 3]];
  let k = 0;
  for (const [h, n] of hours) {
    for (let j = 0; j < n && k < pool.length; j++, k++) {
      const t = at(2026, 9, 24, h, h === 11 ? R.int(0, 38) : R.int(0, 59));
      const dur = R.int(45, 95);
      const out_ = new Date(t.getTime() + dur * 60000);
      out.push({ id: `ci-g${k}`, memberId: pool[k].id, in: t, out: out_ <= TODAY ? out_ : undefined, method: R.chance(0.78) ? 'App QR' : 'Front desk' });
    }
  }
  return out.sort((a, b) => b.in.getTime() - a.in.getTime());
}
export const seedCheckIns = buildCheckIns(seedMembers);

// ---------- leads ----------
function buildLeads(): Lead[] {
  type L = [string, string, LeadSource, string, string, string, Lead['followKind'], string?];
  const fixed: Record<LeadStage, L[]> = {
    'New Lead': [['Riya Menon', '+91 98980 11245', 'Instagram', 'Quarterly', '—', 'Today, 12:30 PM', 'today'], ['Dev Chauhan', '+91 90990 72418', 'Website', 'Monthly', '—', 'Today, 4:00 PM', 'today'], ['Ananya Rao', '+91 97240 56631', 'WhatsApp', 'Annual', '—', 'Tomorrow, 11 AM', '']],
    Contacted: [['Pooja Nair', '+91 98251 33902', 'Referral', 'Annual', '22 Sep · call', 'Today, 6:00 PM', 'today', 'Rahul Mehta'], ['Harsh Vora', '+91 99098 21457', 'Instagram', 'Half Yearly', 'Yesterday · WhatsApp', '25 Sep', ''], ['Mihir Desai', '+91 97129 80344', 'Walk-in', 'Monthly', '23 Sep · visit', '26 Sep', '']],
    'Trial Booked': [['Sameer Khan', '+91 90331 64520', 'WhatsApp', 'Quarterly', '23 Sep · call', 'Trial today, 7 PM', 'today'], ['Tanvi Shah', '+91 98795 40113', 'Instagram', 'Monthly', '22 Sep · WhatsApp', 'Trial 25 Sep, 7 AM', '']],
    Visited: [['Nikhil Jain', '+91 98240 91276', 'Walk-in', 'Annual', '23 Sep · tour', 'Today, 5:30 PM', 'today'], ['Zoya Ali', '+91 99250 37718', 'Website', 'Quarterly', '22 Sep · trial', '25 Sep', '']],
    Interested: [['Aditya Bhatt', '+91 97370 22481', 'Referral', 'Annual + PT', '23 Sep · trial PT', 'Today, 5:00 PM', 'today', 'Karan Malhotra'], ['Simran Kaur', '+91 90990 58830', 'Instagram', 'Half Yearly', '19 Sep · call', 'Overdue · 22 Sep', 'late']],
    Converted: [['Priya Shah', '+91 99090 17452', 'Instagram', 'Monthly', 'Joined 24 Sep', 'Onboarded', 'done'], ['Rohan Kulkarni', '+91 98253 44219', 'Referral', 'PT · 12 sessions', 'Joined 24 Sep', 'Onboarded', 'done', 'Amit Patel']],
    Lost: [['Farhan Qureshi', '+91 97243 90126', 'Website', 'Monthly', 'Reason: price', 'Win-back in Oct', 'lost']],
  };
  const target: Record<LeadStage, number> = { 'New Lead': 24, Contacted: 18, 'Trial Booked': 9, Visited: 7, Interested: 6, Converted: 31, Lost: 8 };
  const sources: [LeadSource, number][] = [['Instagram', 48], ['WhatsApp', 34], ['Walk-in', 26], ['Website', 21], ['Referral', 13]];
  const plans = ['Monthly', 'Quarterly', 'Half Yearly', 'Annual', 'Annual + PT'];
  const lost = ['price', 'joined elsewhere', 'moved city', 'timing', 'no response'];
  const out: Lead[] = [];
  let n = 0;
  (Object.keys(target) as LeadStage[]).forEach((stage) => {
    fixed[stage].forEach(([name, ph, src, plan, last, next, kind, ref]) => {
      out.push({ id: `L${++n}`, name, phone: ph, source: src, referredBy: ref, plan, stage, lastContact: last, nextFollowUp: next, followKind: kind, created: at(2026, 9, R.int(10, 24)), lostReason: stage === 'Lost' ? 'price' : undefined });
    });
    for (let i = fixed[stage].length; i < target[stage]; i++) {
      const g = R.chance(0.55);
      const d = R.int(1, 23);
      const src = R.weighted(sources);
      const nextDay = R.int(24, 30);
      const done = stage === 'Converted', isLost = stage === 'Lost';
      out.push({
        id: `L${++n}`, name: `${R.pick(g ? MALE : FEMALE)} ${R.pick(SURNAMES)}`, phone: phone(), source: src,
        referredBy: src === 'Referral' ? seedMembers[R.int(0, 400)].name : undefined, plan: R.pick(plans), stage,
        lastContact: stage === 'New Lead' ? '—' : done ? `Joined ${d} Sep` : `${d} Sep · ${R.pick(['call', 'WhatsApp', 'visit'])}`,
        nextFollowUp: done ? 'Onboarded' : isLost ? 'Win-back in Oct' : nextDay === 24 ? 'Today, 6:00 PM' : `${nextDay} Sep`,
        followKind: done ? 'done' : isLost ? 'lost' : nextDay === 24 ? 'today' : '',
        created: at(2026, 9, Math.min(d, 24)), lostReason: isLost ? R.pick(lost) : undefined,
      });
    }
  });
  return out;
}
export const seedLeads = buildLeads();

// ---------- trainer sessions ----------
function buildSessions(members: Member[]): Session[] {
  const byName = (n: string) => members.find((m) => m.name === n)?.id;
  const s: Session[] = [];
  let i = 0;
  const add = (trainerId: string, title: string, sub: string, when: Date, memberName?: string) =>
    s.push({ id: `s${++i}`, trainerId, title, sub, at: when, memberId: memberName ? byName(memberName) : undefined });
  add('t-john', 'Group · Strength basics', '12 members', at(2026, 9, 24, 6, 0));
  add('t-john', 'PT · Karan Malhotra', 'Upper body', at(2026, 9, 24, 7, 30), 'Karan Malhotra');
  add('t-john', 'Floor duty', 'Main floor', at(2026, 9, 24, 9, 0));
  add('t-john', 'PT · Aditya Bhatt', 'Trial session', at(2026, 9, 24, 17, 0));
  add('t-john', 'PT · Rahul Mehta', 'Leg day', at(2026, 9, 24, 18, 0), 'Rahul Mehta');
  add('t-john', 'PT · Neha Desai', 'Shared slot · mobility', at(2026, 9, 24, 18, 0), 'Neha Desai');
  add('t-john', 'Assessment · Priya Shah', 'New member', at(2026, 9, 24, 19, 30), 'Priya Shah');
  add('t-john', 'PT · Karan Malhotra', 'Push day', at(2026, 9, 25, 7, 0), 'Karan Malhotra');
  add('t-john', 'PT · Aditya Bhatt', 'Trial follow-up', at(2026, 9, 25, 17, 0));
  add('t-john', 'PT · Sneha Kapoor', 'Full body', at(2026, 9, 26, 8, 0), 'Sneha Kapoor');
  add('t-john', 'PT · Rahul Mehta', 'Chest & triceps', at(2026, 9, 28, 18, 0), 'Rahul Mehta');
  add('t-aisha', 'Group · Morning yoga', '18 members', at(2026, 9, 24, 7, 0));
  add('t-aisha', 'PT · Kavya Iyer', 'Mobility', at(2026, 9, 24, 10, 30), 'Kavya Iyer');
  add('t-aisha', 'Group · Women’s strength', '14 members', at(2026, 9, 24, 11, 30));
  add('t-aisha', 'PT · Priya Shah', 'Onboarding', at(2026, 9, 25, 9, 0), 'Priya Shah');
  add('t-aisha', 'Group · Morning yoga', '18 members', at(2026, 9, 25, 7, 0));
  add('t-rohit', 'Group · HIIT', '20 members', at(2026, 9, 24, 18, 30));
  add('t-rohit', 'PT · Amit Patel', 'Conditioning', at(2026, 9, 24, 19, 30), 'Amit Patel');
  add('t-rohit', 'PT · Vikram Singh', 'Fat loss check-in', at(2026, 9, 25, 20, 0), 'Vikram Singh');
  add('t-rohit', 'Group · HIIT', '20 members', at(2026, 9, 26, 18, 30));
  add('t-meera', 'Diet review · Sneha Kapoor', 'Monthly check-in', at(2026, 9, 25, 10, 0), 'Sneha Kapoor');
  add('t-meera', 'Group · Functional', '10 members', at(2026, 9, 26, 8, 30));
  add('t-meera', 'Diet review · Ishita Joshi', 'New plan', at(2026, 9, 26, 12, 0), 'Ishita Joshi');
  return s;
}
export const seedSessions = buildSessions(seedMembers);

export const seedActivity: Activity[] = [
  { id: 'a1', icon: 'refresh', who: 'Karan Malhotra', what: 'renewed the Quarterly plan', sub: '₹7,499 · UPI', at: at(2026, 9, 24, 11, 32), memberId: 'C29-0934' },
  { id: 'a2', icon: 'user', who: 'Priya Shah', what: 'joined Club29', sub: 'Monthly plan · assigned to Aisha Khan', at: at(2026, 9, 24, 11, 16), memberId: 'C29-1318' },
  { id: 'a3', icon: 'wallet', who: 'Amit Patel', what: 'completed a payment', sub: '₹12,999 · Half Yearly · Card', at: at(2026, 9, 24, 10, 59), memberId: 'C29-0987' },
  { id: 'a4', icon: 'calendar', who: 'Neha Desai', what: 'booked a PT session', sub: 'With John Smith · Today, 6:00 PM', at: at(2026, 9, 24, 10, 40), memberId: 'C29-1175' },
  { id: 'a5', icon: 'funnel', who: 'Riya Menon', what: 'new lead from Instagram', sub: 'Interested in Quarterly', at: at(2026, 9, 24, 10, 25) },
  { id: 'a6', icon: 'flame', who: 'Rahul Mehta', what: 'hit 18 visits this month', sub: 'Best month since March', at: at(2026, 9, 24, 9, 40), memberId: 'C29-1042' },
];
