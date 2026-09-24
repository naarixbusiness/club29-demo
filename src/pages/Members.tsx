import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AddMemberModal, RecordPaymentModal, RenewModal } from '../components/modals';
import { Avatar, Badge, Btn, Chip, Delta, Kpi, Menu, MoreMenu, PageHead, Pager, Person, Progress, SearchBox, SelectBox, Strong, Empty } from '../components/ui';
import { MAIN_PLAN_IDS } from '../data/catalog';
import type { Member } from '../data/types';
import { TODAY, daysBetween, fmtDate } from '../lib/date';
import { count } from '../lib/format';
import { canEdit, canSee } from '../store/auth';
import { STATUS_KIND, memberStatus, paymentState } from '../store/selectors';
import { useStore } from '../store/store';

const FILTERS = ['All', 'Active', 'Expiring soon', 'Expired', 'New'] as const;
type Filter = (typeof FILTERS)[number];
const PER_PAGE = 10;

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Members() {
  const { members, invoices, trainers, user, remind, checkIn, toast } = useStore();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const role = user!.role;
  const own = user!.trainerId;
  const editable = canEdit(role, 'members');
  const [q, setQ] = useState(params.get('q') ?? '');
  const filter = (FILTERS as readonly string[]).includes(params.get('f') ?? '') ? (params.get('f') as Filter) : 'All';
  const setFilter = (f: Filter) => { params.set('f', f); setParams(params, { replace: true }); setPage(1); };
  const [trainer, setTrainer] = useState(own ?? 'all');
  const [plan, setPlan] = useState('all');
  const [pay, setPay] = useState<'all' | 'Paid' | 'Due' | 'Overdue'>('all');
  const [sort, setSort] = useState('expiry');
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [renew, setRenew] = useState<Member | null>(null);
  const [paying, setPaying] = useState<Member | null>(null);

  const scope = useMemo(() => (own ? members.filter((m) => m.trainerId === own) : members), [members, own]);
  const statusOf = useMemo(() => new Map(scope.map((m) => [m.id, memberStatus(m)])), [scope]);
  const counts = useMemo(() => {
    const c = { All: scope.length, Active: 0, 'Expiring soon': 0, Expired: 0, New: 0 } as Record<Filter, number>;
    scope.forEach((m) => { const s = statusOf.get(m.id)!; c[s === 'Expiring' ? 'Expiring soon' : s]++; });
    return c;
  }, [scope, statusOf]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = scope.filter((m) => {
      const st = statusOf.get(m.id)!;
      if (filter !== 'All' && (filter === 'Expiring soon' ? st !== 'Expiring' : st !== filter)) return false;
      if (trainer !== 'all' && (trainer === 'none' ? m.trainerId : m.trainerId !== trainer)) return false;
      if (plan !== 'all' && m.planId !== plan) return false;
      if (pay !== 'all') { const p = paymentState(m, invoices).label; if (pay === 'Paid' ? !(p === 'Paid' || p === 'Auto-pay') : pay === 'Due' ? !p.startsWith('Due') : !(p === 'Overdue' || p === 'Failed')) return false; }
      if (s && !(m.name.toLowerCase().includes(s) || m.id.toLowerCase().includes(s) || m.phone.replace(/\s/g, '').includes(s.replace(/\s/g, '')) || m.email.includes(s))) return false;
      return true;
    });
    const by: Record<string, (a: Member, b: Member) => number> = {
      expiry: (a, b) => a.expiry.getTime() - b.expiry.getTime(),
      name: (a, b) => a.name.localeCompare(b.name),
      joined: (a, b) => b.joinDate.getTime() - a.joinDate.getTime(),
      visits: (a, b) => b.visitsThisMonth - a.visitsThisMonth,
    };
    // Expired members sink below current ones when sorting by expiry.
    return out.sort((a, b) => (sort === 'expiry' ? (Number(a.expiry < TODAY) - Number(b.expiry < TODAY)) || by.expiry(a, b) : by[sort](a, b)));
  }, [scope, statusOf, filter, trainer, plan, pay, q, sort, invoices]);

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const shown = rows.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
  const tName = (id?: string) => trainers.find((t) => t.id === id)?.name;
  const avg = scope.reduce((s, m) => s + m.visitsThisMonth, 0) / Math.max(1, scope.length);
  const withTrainer = scope.filter((m) => m.trainerId).length;

  const exportCsv = () => {
    downloadCsv(`club29-members-${filter.toLowerCase().replace(/\s/g, '-')}.csv`, [
      ['Member ID', 'Name', 'Phone', 'Email', 'Plan', 'Trainer', 'Start', 'Expiry', 'Visits (Sep)', 'Payment', 'Status'],
      ...rows.map((m) => [m.id, m.name, m.phone, m.email, m.planLabel, tName(m.trainerId) ?? '', fmtDate(m.start), fmtDate(m.expiry), m.visitsThisMonth, paymentState(m, invoices).label, statusOf.get(m.id)!]),
    ]);
    toast(`Exported ${count(rows.length)} members to CSV`);
  };

  return (
    <>
      <PageHead title={own ? 'My members' : 'Members'} sub={own ? `Members assigned to ${user!.name}` : 'Manage your Club29 members'}
        right={editable && <>
          <Btn icon="download" onClick={() => toast('Import expects the Club29 CSV template · not needed for this demo', 'info')}>Import</Btn>
          <Btn icon="download" onClick={exportCsv}>Export</Btn>
          <Btn v="primary" icon="plus" onClick={() => setAdding(true)}>Add member</Btn>
        </>} />
      <div className="grid g4">
        <Kpi label={own ? 'My members' : 'Total members'} value={count(scope.length)} meta={own ? `${counts.Active + counts.New} active` : <><Delta>4.2%</Delta> this month</>} icon="users" />
        <Kpi label="Avg attendance" value={avg.toFixed(1)} meta="visits / member in September" icon="calcheck" />
        <Kpi label={own ? 'On PT' : 'With a trainer'} value={count(own ? scope.filter((m) => m.ptTotal > 0).length : withTrainer)} meta={own ? 'members with PT sessions' : `${((withTrainer / scope.length) * 100).toFixed(1)}% of members`} icon="trainer" />
        <Kpi label="Using the app" value={count(Math.round(scope.length * 0.811))} meta="81% adoption" icon="smartphone" />
      </div>
      <div className="row between" style={{ gap: 16, flexWrap: 'wrap' }}>
        <SearchBox id="member-search" value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by name, phone or member ID" width={420} />
        <span className="row" style={{ gap: 8, fontSize: 13, color: 'var(--tx3)' }}>Sorted by
          <SelectBox label="Sort members" value={sort} onChange={setSort} width={170} options={[['expiry', 'Expiry, soonest'], ['name', 'Name, A–Z'], ['joined', 'Recently joined'], ['visits', 'Most visits']]} />
        </span>
      </div>
      <div className="row between" style={{ gap: 16, flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => <Chip key={f} label={f} count={count(counts[f])} on={filter === f} onClick={() => setFilter(f)} />)}
        </div>
        <div className="row" style={{ gap: 8 }}>
          {!own && <SelectBox label="Trainer" value={trainer} onChange={(v) => { setTrainer(v); setPage(1); }} width={150} options={[['all', 'All trainers'], ...trainers.map((t) => [t.id, t.name] as [string, string]), ['none', 'No trainer']]} />}
          <SelectBox label="Plan" value={plan} onChange={(v) => { setPlan(v); setPage(1); }} width={140} options={[['all', 'All plans'], ...MAIN_PLAN_IDS.map((id) => [id, { monthly: 'Monthly', quarterly: 'Quarterly', half: 'Half Yearly', annual: 'Annual' }[id]!] as [string, string])]} />
          <Menu items={[{ heading: 'Payment status' }, ...(['all', 'Paid', 'Due', 'Overdue'] as const).map((p) => ({ label: p === 'all' ? 'Any payment status' : p, icon: pay === p ? 'check' : undefined, onClick: () => { setPay(p); setPage(1); } }))]}
            trigger={(_, t) => <Btn size="sm" icon="filter" onClick={t}>{pay === 'all' ? 'More filters' : `Payment: ${pay}`}</Btn>} />
        </div>
      </div>

      <section className="table-card">
        <div className="table-scroll">
          <table className="tbl tight">
            <thead><tr><th>Member</th><th>Contact</th><th>Membership</th><th>Trainer</th><th>Start date</th><th>Expiry</th><th>Attendance · Sep</th><th>Payment</th><th>Status</th><th className="r" /></tr></thead>
            <tbody>
              {shown.map((m) => {
                const st = statusOf.get(m.id)!;
                const p = paymentState(m, invoices);
                return (
                  <tr key={m.id} className="clickable" onClick={() => nav(`/members/${m.id}`)}>
                    <td><Person name={m.name} sub={m.id} /></td>
                    <td><div className="col" style={{ gap: 2 }}><span className="num" style={{ color: 'var(--tx)', fontSize: 13 }}>{m.phone}</span><span style={{ fontSize: 12, color: 'var(--tx3)' }}>{m.email}</span></div></td>
                    <td><Strong>{m.planLabel}</Strong></td>
                    <td>{m.trainerId ? <span className="row" style={{ gap: 8 }}><Avatar name={tName(m.trainerId)!} size={24} />{tName(m.trainerId)}</span> : <span className="muted">Unassigned</span>}</td>
                    <td>{fmtDate(m.start)}</td>
                    <td><span style={{ color: st === 'Expired' ? 'var(--bad)' : st === 'Expiring' ? 'var(--warn)' : 'var(--tx2)', fontWeight: st === 'Expired' || st === 'Expiring' ? 700 : 500 }}>{fmtDate(m.expiry)}</span></td>
                    <td><div className="col" style={{ gap: 6, width: 84 }}><span style={{ fontSize: 12 }}><span className="num" style={{ color: 'var(--tx)', fontWeight: 600 }}>{m.visitsThisMonth}</span> visits</span><Progress h={4} value={(m.visitsThisMonth / TODAY.getDate()) * 100} color={m.visitsThisMonth >= 12 ? undefined : 'var(--gray)'} /></div></td>
                    <td><Badge kind={p.kind} dot={false}>{p.label}</Badge></td>
                    <td><Badge kind={STATUS_KIND[st]}>{st}</Badge></td>
                    <td className="r" onClick={(e) => e.stopPropagation()}>
                      <MoreMenu label={`More actions for ${m.name}`} items={[
                        { label: 'View profile', icon: 'user', onClick: () => nav(`/members/${m.id}`) },
                        ...(editable ? [
                          { label: 'Renew membership', icon: 'refresh', onClick: () => setRenew(m) },
                          { label: 'Record payment', icon: 'receipt', onClick: () => setPaying(m) },
                          { label: 'Send reminder', icon: 'send', onClick: () => remind([m.id]) },
                          ...(canSee(role, 'attendance') && canEdit(role, 'attendance') ? [{ label: 'Check in now', icon: 'qr', onClick: () => { const r = checkIn(m.id, 'Front desk'); if (!r.ok) toast(r.msg, 'bad'); } }] : []),
                        ] : []),
                      ]} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!shown.length && <Empty>No members match these filters. {daysBetween(TODAY, TODAY) === 0 && <button type="button" className="link" onClick={() => { setQ(''); setFilter('All'); setPlan('all'); setPay('all'); if (!own) setTrainer('all'); }}>Clear filters</button>}</Empty>}
        </div>
        <div className="tc-foot">
          <span>Showing <span style={{ color: 'var(--tx)', fontWeight: 700 }}>{rows.length ? `${(cur - 1) * PER_PAGE + 1}–${Math.min(cur * PER_PAGE, rows.length)}` : 0}</span> of {count(rows.length)} members</span>
          <Pager page={cur} pages={pages} onPage={setPage} />
        </div>
      </section>
      {adding && <AddMemberModal onClose={() => setAdding(false)} onCreated={(m) => nav(`/members/${m.id}`)} />}
      {renew && <RenewModal member={renew} onClose={() => setRenew(null)} />}
      {paying && <RecordPaymentModal member={paying} onClose={() => setPaying(null)} />}
    </>
  );
}
