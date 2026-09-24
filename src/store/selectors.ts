import { PLANS } from '../data/catalog';
import type { Invoice, Member, MemberStatus } from '../data/types';
import { TODAY, daysBetween, startOfDay } from '../lib/date';

export const planOf = (id: string) => PLANS.find((p) => p.id === id);

export function memberStatus(m: Member, now = TODAY): MemberStatus {
  const left = daysBetween(now, m.expiry);
  if (left < 0) return 'Expired';
  if (left <= 7) return 'Expiring';
  if (daysBetween(m.joinDate, now) <= 30 && m.joinDate.getMonth() === now.getMonth()) return 'New';
  return 'Active';
}
export const STATUS_KIND: Record<MemberStatus, 'ok' | 'warn' | 'bad' | 'accent'> = { Active: 'ok', New: 'accent', Expiring: 'warn', Expired: 'bad' };

export function openInvoice(m: Member, invoices: Invoice[]) {
  return invoices.find((i) => i.memberId === m.id && (i.status === 'Pending' || i.status === 'Overdue' || i.status === 'Failed'));
}

export function paymentState(m: Member, invoices: Invoice[]): { label: string; kind: 'ok' | 'warn' | 'bad' } {
  const open = openInvoice(m, invoices);
  if (open?.status === 'Overdue' || open?.status === 'Failed') return { label: open.status, kind: 'bad' };
  if (open) return { label: `Due ₹${open.amount.toLocaleString('en-IN')}`, kind: 'warn' };
  if (m.autopay) return { label: 'Auto-pay', kind: 'ok' };
  return { label: 'Paid', kind: 'ok' };
}

export function renewalBadge(m: Member, invoices: Invoice[], now = TODAY): { label: string; kind: 'ok' | 'warn' | 'bad' | 'neutral' } {
  const left = daysBetween(now, m.expiry);
  if (left < 0) return { label: `Overdue ${-left} day${left === -1 ? '' : 's'}`, kind: 'bad' };
  if (m.autopay) return { label: 'Auto-pay on', kind: 'ok' };
  if (left === 0) return { label: 'Due today', kind: 'warn' };
  if (left <= 7) return { label: `Due in ${left} day${left === 1 ? '' : 's'}`, kind: 'warn' };
  void invoices;
  return { label: `In ${left} days`, kind: 'neutral' };
}

export const isCurrentMonth = (d: Date, now = TODAY) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d <= now;
export const isToday = (d: Date, now = TODAY) => startOfDay(d).getTime() === startOfDay(now).getTime();
export const paidThisMonth = (invoices: Invoice[]) => invoices.filter((i) => i.status === 'Paid' && isCurrentMonth(i.date)).reduce((s, i) => s + i.amount, 0);
