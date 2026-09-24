import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bars, Line } from '../components/charts';
import { Icon } from '../components/Icon';
import { AddMemberModal, RenewModal } from '../components/modals';
import { Badge, Btn, Card, CardHead, Delta, Kpi, Num, PageHead, Person, Progress, Seg, Strong } from '../components/ui';
import { ACTIVE_HISTORY, MONTHS_12, PEAK_HOURS, PEAK_LABELS, REVENUE_HISTORY, SEP_DAILY_CHECKINS } from '../data/history';
import type { Member } from '../data/types';
import { TODAY, addDays, daysBetween, relTime, startOfDay, weekday } from '../lib/date';
import { count, inr, inrShort } from '../lib/format';
import { canSee, seesRevenue } from '../store/auth';
import { isCurrentMonth, isToday, paidThisMonth, renewalBadge } from '../store/selectors';
import { now, useStore } from '../store/store';

export function useRevenueSeries() {
  const { invoices } = useStore();
  return useMemo(() => {
    const sep = paidThisMonth(invoices);
    const k = sep / 1e5 / 18.6; // keep the historic shape, scaled to this gym's live September
    const hist = REVENUE_HISTORY.map((v) => +(v * k).toFixed(1));
    const months = [...hist, +(sep / 1e5).toFixed(1)];
    const daily = Array.from({ length: TODAY.getDate() }, (_, d) => invoices.filter((i) => i.status === 'Paid' && isCurrentMonth(i.date) && i.date.getDate() === d + 1).reduce((s, i) => s + i.amount, 0));
    return { sep, aug: hist[hist.length - 1] * 1e5, months, daily };
  }, [invoices]);
}

export default function Dashboard() {
  const { members, invoices, checkIns, activity, user, remind } = useStore();
  const nav = useNavigate();
  const role = user!.role;
  const money = seesRevenue(role);
  const [range, setRange] = useState<'30D' | '6M' | '12M'>('12M');
  const [renew, setRenew] = useState<Member | null>(null);
  const [adding, setAdding] = useState(false);
  const [reminded, setReminded] = useState<Set<string>>(new Set());
  const rev = useRevenueSeries();

  const today = startOfDay(TODAY);
  const active = members.filter((m) => m.expiry >= today);
  const newM = members.filter((m) => isCurrentMonth(m.joinDate));
  const expiring = members.filter((m) => { const d = daysBetween(TODAY, m.expiry); return d >= 0 && d <= 7; });
  const expired = members.filter((m) => m.expiry < today && daysBetween(m.expiry, TODAY) <= 30);
  const open = invoices.filter((i) => i.status !== 'Paid');
  const openAmt = open.reduce((s, i) => s + i.amount, 0);
  const openMembers = new Set(open.map((i) => i.memberId)).size;
  const renewals = invoices.filter((i) => i.status === 'Paid' && isCurrentMonth(i.date) && !newM.some((m) => m.id === i.memberId)).length;
  const todayIns = checkIns.filter((c) => isToday(c.in));
  const inGym = todayIns.filter((c) => !c.out).length;
  const done = todayIns.filter((c) => c.out);
  const avgSession = done.length ? Math.round(done.reduce((s, c) => s + (c.out!.getTime() - c.in.getTime()) / 60000, 0) / done.length) : 0;
  const vsAug = ((rev.sep / rev.aug - 1) * 100).toFixed(1);

  const upcoming = members
    .filter((m) => { const d = daysBetween(TODAY, m.expiry); return d >= -7 && d <= 30; })
    .sort((a, b) => a.expiry.getTime() - b.expiry.getTime())
    .slice(0, 6);
  const featuredFirst = ['C29-0856', 'C29-1175', 'C29-1203', 'C29-1099', 'C29-0712', 'C29-1042'].map((id) => members.find((m) => m.id === id)!).filter((m) => m && daysBetween(TODAY, m.expiry) >= -7);
  const renewRows = [...featuredFirst, ...upcoming.filter((m) => !featuredFirst.includes(m))].slice(0, 6);

  const revBars = range === '12M' ? { values: rev.months, labels: MONTHS_12, hi: [11] }
    : range === '6M' ? { values: rev.months.slice(6), labels: MONTHS_12.slice(6), hi: [5] }
      : { values: rev.daily.map((v) => +(v / 1e5).toFixed(2)), labels: rev.daily.map((_, i) => String(i + 1)), hi: [rev.daily.length - 1] };
  const revMax = Math.ceil(Math.max(...revBars.values) / 5) * 5 || 1;

  const week = [...SEP_DAILY_CHECKINS.slice(17, 23), todayIns.length];
  const weekLabels = [...Array.from({ length: 6 }, (_, i) => weekday(addDays(TODAY, i - 6))), 'Today'];

  const kpis = (
    <div className="grid g6">
      <Kpi label="Active members" value={count(active.length)} meta={(() => { const d = ((active.length - ACTIVE_HISTORY[4]) / ACTIVE_HISTORY[4]) * 100; return <><Delta down={d < 0} good={d >= 0}>{Math.abs(d).toFixed(1)}%</Delta> vs August</>; })()} icon="users" onClick={canSee(role, 'members') ? () => nav('/members') : undefined} />
      <Kpi label="New members" value={count(newM.length)} meta={<><Delta>{newM.length - 74}</Delta> vs August</>} icon="plus" onClick={canSee(role, 'members') ? () => nav('/members?f=New') : undefined} />
      <Kpi label="Check-ins today" value={count(todayIns.length)} meta="Peak expected 7–8 PM" icon="calcheck" onClick={canSee(role, 'attendance') ? () => nav('/attendance') : undefined} />
      {money
        ? <Kpi label="Revenue · Sep" value={inrShort(rev.sep)} meta={<><Delta>{vsAug}%</Delta> vs August</>} icon="wallet" onClick={() => nav('/payments')} />
        : <Kpi label="Renewals · Sep" value={count(renewals)} meta="Paid renewals this month" icon="refresh" />}
      <Kpi label="Pending payments" value={inrShort(openAmt)} meta={<><span style={{ color: 'var(--warn)', fontWeight: 700 }}>{openMembers} members</span> to follow up</>} icon="receipt" onClick={canSee(role, 'payments') ? () => nav('/payments?tab=Pending') : undefined} />
      <Kpi label="Expiring soon" value={count(expiring.length)} meta={<>Next 7 days {canSee(role, 'members') && <> · <button type="button" className="link" onClick={() => nav('/members?f=Expiring soon')}>View</button></>}</>} icon="clock" />
    </div>
  );

  const revenueCard = (
    <Card className="span2">
      <CardHead title="Revenue" sub="Membership, PT and add-on collections" right={<Seg items={['30D', '6M', '12M'] as const} value={range} onChange={setRange} />} />
      <div className="row" style={{ gap: 40, flexWrap: 'wrap' }}>
        <div className="col" style={{ gap: 6 }}>
          <span className="row" style={{ fontSize: 12, color: 'var(--tx3)', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)' }} />September (to date)</span>
          <span className="num" style={{ fontSize: 30, fontWeight: 700 }}>{inr(rev.sep)}</span>
          <span style={{ fontSize: 12, color: 'var(--tx3)' }}><Delta>{vsAug}%</Delta> · {inr(rev.sep - rev.aug)} more than August</span>
        </div>
        <div style={{ width: 1, background: 'var(--line)' }} />
        <div className="col" style={{ gap: 6 }}>
          <span className="row" style={{ fontSize: 12, color: 'var(--tx3)', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--gray)' }} />August</span>
          <span className="num" style={{ fontSize: 30, fontWeight: 700, color: 'var(--tx2)' }}>{inr(rev.aug)}</span>
          <span style={{ fontSize: 12, color: 'var(--tx3)' }}>Full month</span>
        </div>
        <div style={{ width: 1, background: 'var(--line)' }} />
        <div className="col" style={{ gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--tx3)' }}>Avg revenue / member</span>
          <span className="num" style={{ fontSize: 30, fontWeight: 700, color: 'var(--tx2)' }}>{inr(rev.sep / active.length)}</span>
          <span style={{ fontSize: 12, color: 'var(--tx3)' }}>Active members this month</span>
        </div>
      </div>
      <Bars h={220} values={revBars.values} labels={revBars.labels} hi={revBars.hi} max={revMax} ticks={[0, revMax / 4, revMax / 2, (revMax * 3) / 4, revMax].map((v) => +v.toFixed(2))}
        fmt={(v) => (v ? `₹${v}L` : '0')} tip={(l, v) => `${range === '30D' ? `${l} Sep` : l}: ₹${v} lakh`} valueLabels={range !== '30D'} bw={range === '30D' ? 14 : 30} />
    </Card>
  );

  const mrow = (l: string, v: number, p: number, sub: string, col?: string) => (
    <div className="col" style={{ gap: 8 }}>
      <div className="row between" style={{ alignItems: 'baseline' }}>
        <span style={{ fontSize: 13, color: 'var(--tx2)', fontWeight: 600 }}>{l}</span>
        <span className="row" style={{ alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 12, color: 'var(--tx3)' }}>{sub}</span><Num size={16}>{count(v)}</Num></span>
      </div>
      <Progress value={p} color={col} />
    </div>
  );
  const renewalRate = Math.round((renewals / (renewals + expired.length)) * 100);
  const membersCard = (
    <Card>
      <CardHead title="Members" sub="September snapshot" right={canSee(role, 'reports') ? <button type="button" className="link" onClick={() => nav('/reports')}>Report</button> : undefined} />
      <div className="row between" style={{ alignItems: 'flex-end' }}>
        <div className="col" style={{ gap: 6 }}><span style={{ fontSize: 12, color: 'var(--tx3)' }}>Active members</span><span className="num" style={{ fontSize: 30, fontWeight: 700 }}>{count(active.length)}</span></div>
        <span style={{ fontSize: 12, color: 'var(--tx3)', paddingBottom: 4 }}><Delta>+{active.length - ACTIVE_HISTORY[0]}</Delta> in 6 months</span>
      </div>
      <Line h={104} series={[{ name: 'Active', color: '#F5A01E', area: true, values: [...ACTIVE_HISTORY, active.length] }]} labels={['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']} min={1100} max={Math.max(1260, active.length + 10)} ticks={[1100, Math.max(1260, active.length + 10)]} fmt={(v) => count(v)} pl={40} pr={4} endLabel={false} />
      <div className="col" style={{ gap: 16, paddingTop: 4 }}>
        {mrow('New registrations', newM.length, (newM.length / 250) * 100, 'this month')}
        {mrow('Renewals', renewals, (renewals / 500) * 100, `${renewalRate}% renewal rate`)}
        {mrow('Expired, not renewed', expired.length, (expired.length / 250) * 100, 'Win-back list', 'var(--gray)')}
      </div>
    </Card>
  );

  const attendanceCard = (
    <Card className="span2">
      <CardHead title="Attendance" sub={`Thursday, 24 Sep · updated ${now().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`} right={canSee(role, 'attendance') ? <Btn size="sm" trail="chevright" onClick={() => nav('/attendance')}>Open attendance</Btn> : undefined} />
      <div className="grid g4" style={{ gap: 12 }}>
        {[['Check-ins today', count(todayIns.length), 'of ~330 expected'], ['In the gym now', String(inGym), 'Capacity 150'], ['Avg session', `${avgSession} min`, 'Today, completed visits'], ['Peak hour', '7–8 PM', '43 check-ins avg']].map(([l, v, s]) => (
          <div key={l} className="tile"><span style={{ fontSize: 12, color: 'var(--tx3)' }}>{l}</span><span className="num" style={{ fontSize: 22, fontWeight: 700 }}>{v}</span><span style={{ fontSize: 11, color: 'var(--tx3)' }}>{s}</span></div>
        ))}
      </div>
      <div className="grid stack-md" style={{ gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)', gap: 32 }}>
        <div className="col" style={{ gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx2)' }}>Last 7 days</span>
          <Bars h={170} values={week} labels={weekLabels} max={400} ticks={[0, 200, 400]} hi={[6]} tip={(l, v) => `${l}: ${v} check-ins`} pl={32} bw={22} />
        </div>
        <div className="col" style={{ gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx2)' }}>Peak hours <span style={{ fontWeight: 500, color: 'var(--tx3)' }}>· avg check-ins per hour, last 30 days</span></span>
          <Bars h={170} values={PEAK_HOURS} labels={PEAK_LABELS} max={50} ticks={[0, 25, 50]} hi={[14]} tip={(l, v) => `${l}: ${v} check-ins`} pl={28} bw={11} labelEvery={3} />
        </div>
      </div>
    </Card>
  );

  const activityCard = (
    <Card>
      <CardHead title="Recent activity" sub="Live across Club29" />
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }} className="col">
        {activity.slice(0, 6).map((a, i) => (
          <li key={a.id} className="row" style={{ gap: 14, padding: '14px 0', borderTop: i ? '1px solid var(--line)' : undefined, paddingTop: i ? 14 : 0, alignItems: 'flex-start', cursor: a.memberId && canSee(role, 'profile') ? 'pointer' : undefined }} onClick={() => a.memberId && canSee(role, 'profile') && nav(`/members/${a.memberId}`)}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--card2)', border: '1px solid var(--line2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx2)', flexShrink: 0 }}><Icon name={a.icon} size={17} /></span>
            <div className="col grow" style={{ gap: 3, minWidth: 0 }}>
              <span style={{ fontSize: 14, color: 'var(--tx2)', lineHeight: 1.4 }}><span style={{ color: 'var(--tx)', fontWeight: 700 }}>{a.who}</span> {a.what}</span>
              <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{money || !a.sub.includes('₹') ? a.sub : a.sub.replace(/₹[\d,]+ · /, '')}</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--tx3)', whiteSpace: 'nowrap' }}>{relTime(a.at, now())}</span>
          </li>
        ))}
      </ol>
    </Card>
  );

  const renewalsCard = (
    <section className={`table-card${money ? '' : ' span2'}`}>
      <div className="tc-head">
        <CardHead title="Upcoming renewals" sub={`${renewRows.length} members need attention in the next 30 days`} right={<>
          <Btn size="sm" icon="send" onClick={() => { const ids = renewRows.filter((m) => !m.autopay && daysBetween(TODAY, m.expiry) >= 0).map((m) => m.id); remind(ids); setReminded(new Set(ids)); }}>Send all reminders</Btn>
          {canSee(role, 'members') && <Btn size="sm" v="ghost" onClick={() => nav('/members?f=Expiring soon')}>View all</Btn>}
        </>} />
      </div>
      <div className="table-scroll">
        <table className="tbl">
          <thead><tr><th>Member</th><th>Plan</th><th>Expiry</th>{money && <th className="r">Amount</th>}<th>Status</th><th className="r" style={{ width: 120 }}>Action</th></tr></thead>
          <tbody>
            {renewRows.map((m) => {
              const b = renewalBadge(m, invoices);
              const d = daysBetween(TODAY, m.expiry);
              return (
                <tr key={m.id} className="clickable" onClick={() => nav(`/members/${m.id}`)}>
                  <td><Person name={m.name} sub={m.id} size={34} /></td>
                  <td><Strong>{m.planLabel}</Strong></td>
                  <td>{m.expiry.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  {money && <td className="r"><Num>{inr(m.planLabel === 'Annual + PT' ? 19999 : ({ monthly: 2999, quarterly: 7499, half: 12999, annual: 19999 } as Record<string, number>)[m.planId] ?? 0)}</Num></td>}
                  <td><Badge kind={b.kind}>{b.label}</Badge></td>
                  <td className="r" onClick={(e) => e.stopPropagation()}>
                    {d < 0 || d === 0 ? <Btn size="sm" v="primary" onClick={() => setRenew(m)}>Renew</Btn>
                      : m.autopay ? <Btn size="sm" v="ghost" onClick={() => nav(`/members/${m.id}`)}>View</Btn>
                        : reminded.has(m.id) ? <Btn size="sm" icon="check" disabled>Sent</Btn>
                          : <Btn size="sm" icon="send" onClick={() => { remind([m.id]); setReminded(new Set([...reminded, m.id])); }}>Remind</Btn>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <>
      <PageHead title={`Good ${now().getHours() < 12 ? 'morning' : now().getHours() < 17 ? 'afternoon' : 'evening'}, ${user!.name === 'Admin' ? 'Admin' : user!.name.split(' ')[0]}`} sub="Here’s what’s happening at Club29 today."
        right={<>
          <span className="row" style={{ gap: 8, height: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line2)', fontSize: 13, fontWeight: 600, color: 'var(--tx2)' }}><Icon name="calendar" size={16} color="var(--tx3)" />Thu, 24 Sep 2026</span>
          {canSee(role, 'reports') && <Btn icon="download" onClick={() => nav('/reports')}>Export</Btn>}
          {canSee(role, 'members') && <Btn v="primary" icon="plus" onClick={() => setAdding(true)}>Add member</Btn>}
        </>} />
      {kpis}
      <div className="grid g3">
        {money ? <>{revenueCard}{membersCard}{attendanceCard}{activityCard}</> : <>{attendanceCard}{membersCard}{renewalsCard}{activityCard}</>}
      </div>
      {money && renewalsCard}
      {renew && <RenewModal member={renew} onClose={() => setRenew(null)} />}
      {adding && <AddMemberModal onClose={() => setAdding(false)} onCreated={(m) => nav(`/members/${m.id}`)} />}
    </>
  );
}
