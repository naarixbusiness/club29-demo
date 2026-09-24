import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { OFFERS, PLANS, PROGRAMS, TRAINERS } from '../data/catalog';
import { seedActivity, seedCheckIns, seedInvoices, seedLeads, seedMembers, seedSessions } from '../data/seed';
import type { Activity, CheckIn, Exercise, Invoice, Lead, LeadStage, Measurement, Member, Method, Offer, Plan, Program, Role, Session, Trainer } from '../data/types';
import { TODAY, addDays, addMonths, fmtDate, startOfDay } from '../lib/date';
import { inr } from '../lib/format';
import { DEMO_PASSWORD, STAFF, type StaffUser } from './auth';
import { planOf } from './selectors';

export type ToastKind = 'ok' | 'info' | 'bad';
interface Toast { id: number; text: string; kind: ToastKind }

// The demo clock starts at 11:40 AM on 24 Sep 2026 and then runs in real time.
const BOOT = Date.now();
export const now = () => new Date(TODAY.getTime() + (Date.now() - BOOT));

function useStoreValue() {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [members, setMembers] = useState<Member[]>(seedMembers);
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices);
  const [checkIns, setCheckIns] = useState<CheckIn[]>(seedCheckIns);
  const [leads, setLeads] = useState<Lead[]>(seedLeads);
  const [plans, setPlans] = useState<Plan[]>(PLANS);
  const [offers, setOffers] = useState<Offer[]>(OFFERS);
  const [programs, setPrograms] = useState<Program[]>(PROGRAMS);
  const [sessions, setSessions] = useState<Session[]>(seedSessions);
  const [activity, setActivity] = useState<Activity[]>(seedActivity);
  const [trainers, setTrainers] = useState<Trainer[]>(TRAINERS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(1000);
  const uid = (p: string) => `${p}${++seq.current}`;

  const toast = useCallback((text: string, kind: ToastKind = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const log = (a: Omit<Activity, 'id' | 'at'>) => setActivity((xs) => [{ ...a, id: uid('a'), at: now() }, ...xs]);
  const nextInvoiceId = () => {
    const n = invoices.filter((i) => i.id.startsWith('INV-2026-')).length + 1 + (seq.current - 1000);
    return `INV-2026-${String(n).padStart(4, '0')}`;
  };
  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? 'Member';

  // ---------- auth ----------
  const login = (email: string, password: string) => {
    const u = STAFF.find((s) => s.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || password !== DEMO_PASSWORD) return false;
    setUser(u);
    return true;
  };
  const switchRole = (role: Role) => setUser(STAFF.find((s) => s.role === role)!);
  const logout = () => setUser(null);

  // ---------- members ----------
  const addMember = (d: { name: string; phone: string; email: string; gender: 'Male' | 'Female'; planId: string; trainerId?: string; method: Method; dob: Date; emergencyName: string; emergencyPhone: string }) => {
    const plan = planOf(d.planId)!;
    const start = startOfDay(now());
    const idNum = Math.max(...members.map((m) => +m.id.slice(4))) + 1;
    const m: Member = {
      id: `C29-${idNum}`, name: d.name, phone: d.phone, email: d.email, gender: d.gender, dob: d.dob, heightCm: 170,
      joinDate: start, planId: plan.id, planLabel: plan.name, start, expiry: addMonths(start, plan.months), trainerId: d.trainerId,
      visitsThisMonth: 0, visitDays: [], totalVisits: 0, autopay: false,
      emergency: { name: d.emergencyName || '—', relation: 'Emergency contact', phone: d.emergencyPhone || '—' },
      programId: d.trainerId ? 'p-general' : undefined, ptUsed: 0, ptTotal: plan.ptSessions, measurements: [], notes: [],
    };
    setMembers((xs) => [m, ...xs]);
    setInvoices((xs) => [{ id: nextInvoiceId(), memberId: m.id, item: plan.name, amount: plan.price, method: d.method, date: now(), status: 'Paid' }, ...xs]);
    log({ icon: 'user', who: m.name, what: 'joined Club29', sub: `${plan.name} plan${d.trainerId ? ` · assigned to ${trainers.find((t) => t.id === d.trainerId)?.name}` : ''}`, memberId: m.id });
    toast(`${m.name} added as ${m.id} · ${inr(plan.price)} collected`);
    return m;
  };
  const updateMember = (id: string, patch: Partial<Member>) => setMembers((xs) => xs.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const renewMember = (id: string, planId: string, method: Method) => {
    const m = members.find((x) => x.id === id)!;
    const plan = planOf(planId)!;
    const base = m.expiry > startOfDay(now()) ? m.expiry : startOfDay(now());
    const expiry = addMonths(base, plan.months);
    updateMember(id, { planId, planLabel: plan.name, start: base, expiry, ptTotal: m.ptTotal + plan.ptSessions });
    setInvoices((xs) => {
      const cleared = xs.map((i) => (i.memberId === id && (i.status === 'Pending' || i.status === 'Overdue') ? { ...i, status: 'Paid' as const, method, date: now() } : i));
      const hadOpen = xs.some((i) => i.memberId === id && (i.status === 'Pending' || i.status === 'Overdue') && i.amount === plan.price);
      return hadOpen ? cleared : [{ id: nextInvoiceId(), memberId: id, item: plan.name, amount: plan.price, method, date: now(), status: 'Paid' }, ...cleared];
    });
    log({ icon: 'refresh', who: m.name, what: `renewed the ${plan.name} plan`, sub: `${inr(plan.price)} · ${method}`, memberId: id });
    toast(`${m.name} renewed till ${fmtDate(expiry)}`);
  };

  const freezeMember = (id: string, days: number) => {
    const m = members.find((x) => x.id === id)!;
    updateMember(id, { expiry: addDays(m.expiry, days), frozenUntil: addDays(now(), days) });
    toast(`${m.name} frozen for ${days} days · expiry moved to ${fmtDate(addDays(m.expiry, days))}`, 'info');
  };
  const addNote = (id: string, text: string, by: string) => {
    const m = members.find((x) => x.id === id)!;
    updateMember(id, { notes: [{ id: uid('n'), at: now(), by, text }, ...m.notes] });
    toast('Note saved');
  };
  const addMeasurement = (id: string, meas: Omit<Measurement, 'date'>) => {
    const m = members.find((x) => x.id === id)!;
    updateMember(id, { measurements: [...m.measurements, { ...meas, date: now() }] });
    toast(`Measurement saved for ${m.name}`);
  };

  // ---------- payments ----------
  const recordPayment = (d: { memberId: string; item: string; amount: number; method: Method }) => {
    const open = invoices.find((i) => i.memberId === d.memberId && (i.status === 'Pending' || i.status === 'Overdue' || i.status === 'Failed') && i.amount === d.amount);
    if (open) {
      setInvoices((xs) => xs.map((i) => (i.id === open.id ? { ...i, status: 'Paid', method: d.method, date: now() } : i)));
    } else {
      setInvoices((xs) => [{ id: nextInvoiceId(), memberId: d.memberId, item: d.item, amount: d.amount, method: d.method, date: now(), status: 'Paid' }, ...xs]);
    }
    log({ icon: 'wallet', who: memberName(d.memberId), what: 'completed a payment', sub: `${inr(d.amount)} · ${d.item} · ${d.method}`, memberId: d.memberId });
    toast(`${inr(d.amount)} received from ${memberName(d.memberId)} via ${d.method}`);
  };
  const generateInvoice = (d: { memberId: string; item: string; amount: number }) => {
    const id = nextInvoiceId();
    setInvoices((xs) => [{ id, memberId: d.memberId, item: d.item, amount: d.amount, method: null, date: now(), status: 'Pending' }, ...xs]);
    toast(`${id} created and payment link sent to ${memberName(d.memberId)} on WhatsApp`, 'info');
  };
  const retryInvoice = (id: string) => {
    const inv = invoices.find((i) => i.id === id)!;
    setInvoices((xs) => xs.map((i) => (i.id === id ? { ...i, status: 'Paid', date: now() } : i)));
    toast(`Card charged again · ${inr(inv.amount)} received from ${memberName(inv.memberId)}`);
  };
  const remind = (memberIds: string[]) => {
    if (memberIds.length === 1) toast(`Reminder sent to ${memberName(memberIds[0])} on WhatsApp and SMS`, 'info');
    else toast(`Reminders sent to ${memberIds.length} members on WhatsApp and SMS`, 'info');
  };

  // ---------- attendance ----------
  const checkIn = (memberId: string, method: CheckIn['method']) => {
    const m = members.find((x) => x.id === memberId);
    if (!m) return { ok: false, msg: 'No member with that ID' };
    if (m.expiry < startOfDay(now())) return { ok: false, msg: `${m.name}'s membership expired on ${fmtDate(m.expiry)}. Renew before check-in.` };
    if (checkIns.some((c) => c.memberId === memberId && !c.out)) return { ok: false, msg: `${m.name} is already in the gym` };
    const t = now();
    setCheckIns((xs) => [{ id: uid('ci'), memberId, in: t, method }, ...xs]);
    const day = t.getDate();
    if (!m.visitDays.includes(day)) updateMember(memberId, { visitsThisMonth: m.visitsThisMonth + 1, visitDays: [...m.visitDays, day], totalVisits: m.totalVisits + 1 });
    toast(`${m.name} checked in`);
    return { ok: true, msg: '' };
  };
  const checkOut = (checkInId: string) => {
    setCheckIns((xs) => xs.map((c) => (c.id === checkInId ? { ...c, out: now() } : c)));
    const c = checkIns.find((x) => x.id === checkInId);
    if (c) toast(`${memberName(c.memberId)} checked out`, 'info');
  };

  // ---------- plans ----------
  const savePlan = (p: Plan) => {
    setPlans((xs) => (xs.some((x) => x.id === p.id) ? xs.map((x) => (x.id === p.id ? p : x)) : [...xs, p]));
    toast(`${p.name} saved`);
  };
  const togglePlan = (id: string) => {
    const p = plans.find((x) => x.id === id)!;
    setPlans((xs) => xs.map((x) => (x.id === id ? { ...x, status: x.status === 'active' ? 'disabled' : 'active' } : x)));
    toast(`${p.name} ${p.status === 'active' ? 'disabled · existing members keep it until expiry' : 'enabled'}`, 'info');
  };
  const addOffer = (o: Offer) => {
    setOffers((xs) => [o, ...xs]);
    toast(`Discount ${o.code} created`);
  };

  // ---------- workouts ----------
  const saveProgram = (p: Program) => setPrograms((xs) => (xs.some((x) => x.id === p.id) ? xs.map((x) => (x.id === p.id ? p : x)) : [...xs, p]));
  const createProgram = (d: { name: string; level: string; weeks: string; days: number; by: string }) => {
    const p: Program = {
      id: uid('p-'), name: d.name, level: d.level, weeks: d.weeks, daysPerWeek: d.days, createdBy: d.by, updated: now(), completion: 0,
      description: 'New program. Add exercises for each day, then assign it to members.', note: '',
      days: Array.from({ length: d.days }, (_, i) => ({ name: `Day ${i + 1}`, focus: 'Untitled day', exercises: [] })),
    };
    saveProgram(p);
    toast(`${p.name} created`);
    return p;
  };
  const duplicateProgram = (id: string) => {
    const src = programs.find((p) => p.id === id)!;
    const p = { ...structuredClone(src), id: uid('p-'), name: `${src.name} (copy)`, updated: now(), completion: 0 };
    saveProgram(p);
    toast(`${src.name} duplicated`);
    return p;
  };
  const addExercise = (programId: string, dayIdx: number, e: Exercise) => {
    const p = programs.find((x) => x.id === programId)!;
    const days = p.days.map((d, i) => (i === dayIdx ? { ...d, exercises: [...d.exercises, e] } : d));
    saveProgram({ ...p, days, updated: now() });
    toast(`${e.name} added to ${p.days[dayIdx].name}`);
  };
  const removeExercise = (programId: string, dayIdx: number, exIdx: number) => {
    const p = programs.find((x) => x.id === programId)!;
    const days = p.days.map((d, i) => (i === dayIdx ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) } : d));
    saveProgram({ ...p, days, updated: now() });
    toast('Exercise removed', 'info');
  };
  const assignProgram = (memberIds: string[], programId: string) => {
    setMembers((xs) => xs.map((m) => (memberIds.includes(m.id) ? { ...m, programId } : m)));
    const p = programs.find((x) => x.id === programId)!;
    toast(memberIds.length === 1 ? `${p.name} assigned to ${memberName(memberIds[0])}` : `${p.name} assigned to ${memberIds.length} members`);
  };

  // ---------- leads ----------
  const addLead = (d: Omit<Lead, 'id' | 'created' | 'stage' | 'lastContact' | 'followKind'>) => {
    const l: Lead = { ...d, id: uid('L'), stage: 'New Lead', lastContact: '—', followKind: d.nextFollowUp.startsWith('Today') ? 'today' : '', created: now() };
    setLeads((xs) => [l, ...xs]);
    log({ icon: 'funnel', who: l.name, what: `new lead from ${l.source}`, sub: `Interested in ${l.plan}` });
    toast(`${l.name} added to New Lead`);
  };
  const moveLead = (id: string, stage: LeadStage) => {
    const l = leads.find((x) => x.id === id)!;
    if (l.stage === stage) return;
    const patch: Partial<Lead> = { stage, lastContact: `Today · moved from ${l.stage}` };
    if (stage === 'Converted') Object.assign(patch, { nextFollowUp: 'Onboarded', followKind: 'done' });
    else if (stage === 'Lost') Object.assign(patch, { nextFollowUp: 'Win-back in Oct', followKind: 'lost', lostReason: 'marked lost' });
    else Object.assign(patch, { nextFollowUp: 'Tomorrow, 11 AM', followKind: '' });
    setLeads((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (stage === 'Converted') log({ icon: 'check', who: l.name, what: 'converted from lead', sub: `${l.plan} · source ${l.source}` });
    toast(`${l.name} moved to ${stage}`, stage === 'Lost' ? 'bad' : 'ok');
  };
  const logContact = (id: string, how: 'Call' | 'WhatsApp') => {
    const l = leads.find((x) => x.id === id)!;
    setLeads((xs) => xs.map((x) => (x.id === id ? { ...x, lastContact: `Today · ${how.toLowerCase()}` } : x)));
    toast(how === 'Call' ? `Calling ${l.name} on ${l.phone}…` : `WhatsApp opened for ${l.name}`, 'info');
  };

  // ---------- trainers ----------
  const saveTrainer = (t: Trainer) => {
    const isNew = !trainers.some((x) => x.id === t.id);
    setTrainers((xs) => (isNew ? [...xs, t] : xs.map((x) => (x.id === t.id ? t : x))));
    toast(isNew ? `${t.name} added to the team` : `${t.name} updated`);
  };

  // ---------- trainer sessions ----------
  const addSession = (s: Omit<Session, 'id'>) => {
    setSessions((xs) => [...xs, { ...s, id: uid('s') }]);
    toast(`${s.title} booked`);
  };

  return {
    user, login, logout, switchRole,
    members, invoices, checkIns, leads, plans, offers, programs, sessions, activity, trainers, saveTrainer,
    addMember, updateMember, renewMember, freezeMember, addNote, addMeasurement,
    recordPayment, generateInvoice, retryInvoice, remind,
    checkIn, checkOut, savePlan, togglePlan, addOffer,
    createProgram, duplicateProgram, addExercise, removeExercise, assignProgram, saveProgram,
    addLead, moveLead, logContact, addSession,
    toasts, toast,
  };
}

export type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside provider');
  return s;
}
