import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grouped } from '../components/charts';
import { Icon } from '../components/Icon';
import { ScanQrModal } from '../components/modals';
import { Badge, Btn, Card, CardHead, Chip, Delta, IconBtn, Kpi, Legend, Num, PageHead, Pager, Person, SearchBox, Tile, Empty } from '../components/ui';
import { LAST_WEEK, SEP_DAILY_CHECKINS } from '../data/history';
import { TODAY, fmtDuration, fmtTime, startOfDay } from '../lib/date';
import { count } from '../lib/format';
import { canEdit } from '../store/auth';
import { isToday } from '../store/selectors';
import { now, useStore } from '../store/store';
import { downloadCsv } from './Members';

const PER_PAGE = 10;

export default function Attendance() {
  const { checkIns, members, user, checkOut, remind, toast } = useStore();
  const nav = useNavigate();
  const edit = canEdit(user!.role, 'attendance');
  const [scan, setScan] = useState(false);
  const [filter, setFilter] = useState<'All' | 'In gym' | 'Checked out'>('All');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [day, setDay] = useState<number | null>(null);
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const today = checkIns.filter((c) => isToday(c.in));
  const inGym = today.filter((c) => !c.out);
  const checkedIds = new Set(today.map((c) => c.memberId));
  const regularsMissing = members.filter((m) => m.expiry >= startOfDay(TODAY) && m.visitsThisMonth >= 16 && !checkedIds.has(m.id));
  const expiredRegular = members.filter((m) => m.expiry < startOfDay(TODAY) && m.visitsThisMonth >= 3 && !checkedIds.has(m.id)).slice(0, 1);
  const daily = [...SEP_DAILY_CHECKINS, today.length];
  const weekSoFar = daily.slice(20).reduce((s, v) => s + v, 0);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return today.filter((c) => {
      if (filter === 'In gym' && c.out) return false;
      if (filter === 'Checked out' && !c.out) return false;
      if (s) { const m = byId.get(c.memberId); if (!(m?.name.toLowerCase().includes(s) || c.memberId.toLowerCase().includes(s))) return false; }
      return true;
    });
  }, [today, filter, q, byId]);
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const shown = rows.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  const maxc = 365;
  const cells = [
    <div key="pad" />,
    ...Array.from({ length: 30 }, (_, i) => {
      const d = i + 1;
      if (d > TODAY.getDate()) return <div key={d} style={{ height: 48, borderRadius: 8, border: '1px dashed var(--line2)', padding: '6px 8px' }}><span style={{ fontSize: 11, color: '#5A554E' }}>{d}</span></div>;
      const c = daily[i];
      const a = 0.12 + 0.78 * Math.pow(Math.max(0, (c - 150) / (maxc - 150)), 1.6);
      const dark = a > 0.55;
      return (
        <button key={d} type="button" title={`${d} Sep: ${c} check-ins`} onClick={() => setDay(d === day ? null : d)} style={{ height: 48, borderRadius: 8, border: 'none', background: `rgba(245,160,30,${a.toFixed(2)})`, boxShadow: d === TODAY.getDate() || d === day ? '0 0 0 2px var(--card), 0 0 0 3px var(--tx)' : undefined, padding: '6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'stretch', textAlign: 'left' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: dark ? 'var(--ink)' : 'var(--tx2)' }}>{d}</span>
          <span className="num" style={{ fontSize: 11, fontWeight: 600, color: dark ? 'var(--ink)' : 'var(--tx3)', textAlign: 'right' }}>{c}</span>
        </button>
      );
    }),
  ];

  const exportCsv = () => {
    downloadCsv('club29-attendance-24-sep-2026.csv', [['Member ID', 'Name', 'Check-in', 'Check-out', 'Duration (min)', 'Method'], ...today.map((c) => [c.memberId, byId.get(c.memberId)?.name ?? '', fmtTime(c.in), c.out ? fmtTime(c.out) : '', Math.round(((c.out ?? now()).getTime() - c.in.getTime()) / 60000), c.method])]);
    toast(`Exported ${today.length} check-ins`);
  };

  return (
    <>
      <PageHead title="Attendance" sub="Thursday, 24 Sep 2026 · live" right={<>
        <Btn icon="download" onClick={exportCsv}>Export</Btn>
        {edit && <Btn icon="plus" onClick={() => setScan(true)}>Manual check-in</Btn>}
        {edit && <Btn v="primary" size="lg" icon="qr" onClick={() => setScan(true)} style={{ fontSize: 15 }}>Scan QR</Btn>}
      </>} />
      <div className="grid g4">
        <Kpi label="Total check-ins" value={count(today.length)} meta={<><Delta>{(((today.length - 179) / 179) * 100).toFixed(1)}%</Delta> vs last Thursday at this time</>} icon="calcheck" onClick={() => setFilter('All')} />
        <Kpi label="In the gym now" value={String(inGym.length)} meta={`Capacity 150 · ${Math.round((inGym.length / 150) * 100)}% full`} icon="users" onClick={() => setFilter('In gym')} />
        <Kpi label="Not arrived" value={String(regularsMissing.length)} meta="Regulars not in yet today" icon="clock" />
        <Kpi label="Peak hour" value="7–8 PM" meta="Avg 43 check-ins · last 30 days" icon="flame" />
      </div>
      <div className="grid g3">
        <Card className="span2">
          <CardHead title="Weekly attendance" sub="This week vs last week" right={<Legend items={[['This week', '#F5A01E'], ['Last week', '#6F6A62']]} />} />
          <Grouped h={250} max={400} ticks={[0, 100, 200, 300, 400]} bw={26} gap={4}
            labels={['Mon', 'Tue', 'Wed', 'Thu (today)', 'Fri', 'Sat', 'Sun']}
            series={[{ name: 'This week', color: '#F5A01E', values: [...SEP_DAILY_CHECKINS.slice(20, 23), today.length, null, null, null] }, { name: 'Last week', color: '#6F6A62', values: LAST_WEEK }]} />
          <div className="grid g3" style={{ gap: 12 }}>
            <Tile label="Week so far" value={count(weekSoFar)} sub="4 days" />
            <Tile label="Avg per day" value={Math.round(weekSoFar / 4)} sub={<><Delta>{(((weekSoFar / 4) / (LAST_WEEK.slice(0, 4).reduce((s, v) => s + v, 0) / 4) - 1) * 100).toFixed(1)}%</Delta> vs last week</>} />
            <Tile label="Busiest day" value="Monday" sub={`${daily[20]} check-ins`} />
          </div>
        </Card>
        <Card>
          <CardHead title="September" sub={day ? `${day} Sep · ${daily[day - 1]} check-ins` : 'Daily check-ins · click a day'} />
          <div className="col" style={{ gap: 6 }}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', textAlign: 'center' }}>{d}</div>)}</div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>{cells}</div>
          </div>
          <div className="row" style={{ gap: 8, fontSize: 11, color: 'var(--tx3)' }}>Fewer{[0.15, 0.35, 0.55, 0.75, 0.9].map((a) => <span key={a} style={{ width: 16, height: 10, borderRadius: 3, background: `rgba(245,160,30,${a})` }} />)}More</div>
        </Card>
      </div>
      <div className="grid stack-md" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px', alignItems: 'start' }}>
        <section className="table-card">
          <div className="tc-head row between" style={{ gap: 16, flexWrap: 'wrap' }}>
            <CardHead title="Today’s log" sub={`${today.length} check-ins · ${inGym.length} in the gym now`} />
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <Chip label="All" count={today.length} on={filter === 'All'} onClick={() => { setFilter('All'); setPage(1); }} />
              <Chip label="In gym" count={inGym.length} on={filter === 'In gym'} onClick={() => { setFilter('In gym'); setPage(1); }} />
              <Chip label="Checked out" count={today.length - inGym.length} on={filter === 'Checked out'} onClick={() => { setFilter('Checked out'); setPage(1); }} />
              <SearchBox id="att-search" value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search member" width={200} />
            </div>
          </div>
          <div className="table-scroll">
            <table className="tbl">
              <thead><tr><th>Member</th><th>Membership</th><th>Check-in</th><th>Check-out</th><th>Duration</th><th>Method</th><th>Status</th>{edit && <th className="r" />}</tr></thead>
              <tbody>
                {shown.map((c) => {
                  const m = byId.get(c.memberId);
                  const mins = Math.max(1, Math.round(((c.out ?? now()).getTime() - c.in.getTime()) / 60000));
                  return (
                    <tr key={c.id}>
                      <td><Person name={m?.name ?? c.memberId} size={32} onClick={() => nav(`/members/${c.memberId}`)} /></td>
                      <td>{m?.planLabel}</td>
                      <td><Num>{fmtTime(c.in)}</Num></td>
                      <td>{c.out ? <Num color="var(--tx2)">{fmtTime(c.out)}</Num> : <span className="muted">—</span>}</td>
                      <td>{fmtDuration(mins)}</td>
                      <td><span className="row" style={{ gap: 8 }}><Icon name={c.method === 'App QR' ? 'qr' : 'user'} size={15} color="var(--tx3)" />{c.method}</span></td>
                      <td>{c.out ? <Badge>Completed</Badge> : <Badge kind="ok">In gym</Badge>}</td>
                      {edit && <td className="r">{!c.out && <Btn size="sm" v="ghost" icon="logout" onClick={() => checkOut(c.id)}>Check out</Btn>}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!shown.length && <Empty>No check-ins match.</Empty>}
          </div>
          <div className="tc-foot"><span>Showing {shown.length} of {rows.length}</span><Pager page={cur} pages={pages} onPage={setPage} /></div>
        </section>
        <div className="col" style={{ gap: 16 }}>
          {edit && (
            <section style={{ borderRadius: 12, padding: 24, background: 'var(--accent)', color: 'var(--ink)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="row between"><Icon name="qr" size={40} color="var(--ink)" /><span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em' }}>FRONT DESK</span></div>
              <div className="col" style={{ gap: 6 }}><span className="display" style={{ fontSize: 22, fontWeight: 700 }}>Scan member QR</span><span style={{ fontSize: 13, lineHeight: 1.5, color: '#3D2604' }}>Members show the pass in their Club29 app. Check-in takes about a second.</span></div>
              <button type="button" onClick={() => setScan(true)} style={{ height: 48, borderRadius: 10, border: 'none', background: 'var(--ink)', color: 'var(--accent)', fontSize: 15, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><Icon name="camera" size={18} />Open scanner</button>
            </section>
          )}
          <Card>
            <CardHead title="Not arrived yet" sub="Regulars who usually come every day" right={edit && <button type="button" className="link" onClick={() => remind(regularsMissing.map((m) => m.id))}>Nudge all</button>} />
            <div className="col" style={{ gap: 14 }}>
              {[...regularsMissing.slice(0, 3), ...expiredRegular].map((m) => (
                <div key={m.id} className="row between" style={{ gap: 12 }}>
                  <Person name={m.name} size={32} sub={m.expiry < startOfDay(TODAY) ? 'Membership expired' : `${m.visitsThisMonth} visits this month`} onClick={() => nav(`/members/${m.id}`)} />
                  {edit && <IconBtn sm icon="message" label={`Message ${m.name}`} onClick={() => remind([m.id])} />}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      {scan && <ScanQrModal onClose={() => setScan(false)} />}
    </>
  );
}
