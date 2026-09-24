import { useState } from 'react';
import { Bars, Grouped, Line, Ring } from '../components/charts';
import { Icon } from '../components/Icon';
import { Btn, Card, CardHead, Delta, Kpi, Legend, Num, PageHead, Person, Progress, Seg } from '../components/ui';
import { AVG_CHECKINS_12, LOST_MEMBERS_12, MONTHS_12, NEW_MEMBERS_12, PEAK_HOURS, PEAK_LABELS, RENEWAL_BY_PLAN, SEP_DAILY_CHECKINS } from '../data/history';
import { TODAY, addDays, daysBetween, startOfDay, weekday } from '../lib/date';
import { count, inr, inrShort } from '../lib/format';
import { isCurrentMonth, isToday } from '../store/selectors';
import { useStore } from '../store/store';
import { useRevenueSeries } from './Dashboard';
import { downloadCsv } from './Members';

const RANGES = ['Today', 'This week', 'This month', 'This year'] as const;
type Range = (typeof RANGES)[number];
const ACC = '#F5A01E', GRAY = '#6F6A62';

export default function Reports() {
  const { members, invoices, checkIns, leads, trainers, toast } = useStore();
  const [range, setRange] = useState<Range>('This year');
  const rev = useRevenueSeries();

  const todayIns = checkIns.filter((c) => isToday(c.in)).length;
  const newSep = members.filter((m) => isCurrentMonth(m.joinDate)).length;
  const lostSep = members.filter((m) => m.expiry < startOfDay(TODAY) && daysBetween(m.expiry, TODAY) <= 30).length;
  const dailyAtt = [...SEP_DAILY_CHECKINS, todayIns];
  const paidToday = invoices.filter((i) => i.status === 'Paid' && isToday(i.date)).reduce((s, i) => s + i.amount, 0);
  const converted = leads.filter((l) => l.stage === 'Converted').length;
  const conv = ((converted / leads.length) * 100).toFixed(1);
  const renewalRate = 78;

  // Revenue series + KPI per range
  const R = {
    Today: { rev: { labels: PEAK_LABELS.slice(0, 7), values: [0.08, 0.31, 0.42, 0.27, 0.19, 0.24, 0.1].map((f) => +((paidToday * f) / 1e3).toFixed(1)), fmt: (v: number) => (v ? `₹${v}k` : '0'), unit: '₹ thousand, by hour' }, total: paidToday, sub: 'collected so far today' },
    'This week': { rev: { labels: Array.from({ length: 7 }, (_, i) => (i === 6 ? 'Today' : weekday(addDays(TODAY, i - 6)))), values: rev.daily.slice(-7).map((v) => +(v / 1e3).toFixed(1)), fmt: (v: number) => (v ? `₹${v}k` : '0'), unit: '₹ thousand, last 7 days' }, total: rev.daily.slice(-7).reduce((s, v) => s + v, 0), sub: 'last 7 days' },
    'This month': { rev: { labels: rev.daily.map((_, i) => String(i + 1)), values: rev.daily.map((v) => +(v / 1e3).toFixed(1)), fmt: (v: number) => (v ? `₹${v}k` : '0'), unit: '₹ thousand, September by day' }, total: rev.sep, sub: 'September to date' },
    'This year': { rev: { labels: MONTHS_12, values: rev.months, fmt: (v: number) => `₹${v}L`, unit: '₹ lakh, Oct 2025 – Sep 2026' }, total: rev.months.reduce((s, v) => s + v, 0) * 1e5, sub: 'last 12 months' },
  }[range];
  const rMax = Math.max(...R.rev.values);
  const rTop = range === 'This year' ? Math.ceil(rMax / 5) * 5 : Math.ceil(rMax / 10) * 10 || 10;

  const newArr = [...NEW_MEMBERS_12, newSep], lostArr = [...LOST_MEMBERS_12, lostSep];
  const attArr = [...AVG_CHECKINS_12, Math.round(dailyAtt.reduce((s, v) => s + v, 0) / dailyAtt.length)];
  const growth = range === 'This year' ? { labels: MONTHS_12, n: newArr, l: lostArr }
    : range === 'This month' ? { labels: ['1–7', '8–14', '15–21', '22–24'], n: [21, 24, 26, newSep - 71], l: [14, 16, 15, lostSep - 45] }
      : { labels: Array.from({ length: 7 }, (_, i) => (i === 6 ? 'Today' : weekday(addDays(TODAY, i - 6)))), n: [3, 2, 1, 4, 3, 2, members.filter((m) => isToday(m.joinDate)).length], l: [2, 1, 2, 1, 2, 3, 1] };
  const att = range === 'This year' ? { labels: MONTHS_12, v: attArr, every: 3 } : range === 'This month' ? { labels: dailyAtt.map((_, i) => String(i + 1)), v: dailyAtt, every: 5 } : range === 'This week' ? { labels: Array.from({ length: 7 }, (_, i) => (i === 6 ? 'Today' : weekday(addDays(TODAY, i - 6)))), v: dailyAtt.slice(-7), every: 1 } : { labels: PEAK_LABELS, v: PEAK_HOURS, every: 3 };
  const attMax = Math.ceil(Math.max(...att.v) / 100) * 100;
  const attMin = range === 'Today' ? 0 : Math.max(0, Math.floor(Math.min(...att.v) / 100) * 100 - 100);

  const reached = (i: number) => leads.filter((l) => l.stage !== 'Lost' && ['New Lead', 'Contacted', 'Trial Booked', 'Visited', 'Interested', 'Converted'].indexOf(l.stage) >= i).length;
  const FUN: [string, number][] = [['Leads', leads.length], ['Contacted', reached(1)], ['Trial booked', reached(2)], ['Visited', reached(3)], ['Interested', reached(4)], ['Converted', converted]];

  const tRows = trainers.map((t) => {
    const mem = members.filter((m) => m.trainerId === t.id).length;
    return { t, mem, pt: t.ptSessionsMonth, ret: t.retention, rev: t.ptSessionsMonth * t.ptRate };
  }).sort((a, b) => b.rev - a.rev);

  const exportReport = () => {
    downloadCsv(`club29-report-${range.toLowerCase().replace(/\s/g, '-')}.csv`, [
      ['Metric', 'Value'], ['Range', range], ['Revenue', Math.round(R.total)], ['Active members', members.filter((m) => m.expiry >= startOfDay(TODAY)).length], ['New members (Sep)', newSep], ['Lost members (last 30 days)', lostSep], ['Check-ins today', todayIns], ['Renewal rate %', renewalRate], ['Lead conversion %', conv],
      [], ['Month', 'Revenue (lakh)', 'New', 'Lost', 'Avg check-ins'], ...MONTHS_12.map((m, i) => [m, rev.months[i], newArr[i], lostArr[i], attArr[i]]),
    ]);
    toast('Report exported');
  };

  return (
    <>
      <PageHead title="Reports" sub="How Club29 is growing" right={<>
        <Seg md items={RANGES} value={range} onChange={setRange} />
        <Btn icon="calendar">{range === 'This year' ? 'Oct 2025 – Sep 2026' : range === 'This month' ? '1 – 24 Sep 2026' : range === 'This week' ? '18 – 24 Sep 2026' : 'Thu, 24 Sep 2026'}</Btn>
        <Btn v="primary" icon="download" onClick={exportReport}>Export</Btn>
      </>} />
      <div className="grid g4">
        <Kpi label="Revenue" value={inrShort(R.total)} meta={R.sub} icon="wallet" />
        <Kpi label="Net new members" value={`+${range === 'This year' ? newArr.reduce((s, v) => s + v, 0) - lostArr.reduce((s, v) => s + v, 0) : growth.n.reduce((s, v) => s + v, 0) - growth.l.reduce((s, v) => s + v, 0)}`} meta={`${count(growth.n.reduce((s, v) => s + v, 0))} joined · ${count(growth.l.reduce((s, v) => s + v, 0))} lost`} icon="users" />
        <Kpi label={range === 'Today' ? 'Check-ins today' : 'Avg daily check-ins'} value={range === 'Today' ? String(todayIns) : count(Math.round(att.v.reduce((s, v) => s + v, 0) / att.v.length))} meta={<><Delta>15%</Delta> vs last year</>} icon="calcheck" />
        <Kpi label="Renewal rate" value={`${renewalRate}%`} meta={<><Delta>4 pts</Delta> vs last year</>} icon="refresh" />
      </div>
      <div className="grid g3" style={{ alignItems: 'start' }}>
        <Card className="span2">
          <CardHead title="Revenue" sub={R.rev.unit} right={<Legend items={[['Revenue', ACC]]} />} />
          {range === 'This year'
            ? <Line h={240} series={[{ name: 'Revenue', color: ACC, area: true, values: R.rev.values }]} labels={R.rev.labels} min={10} max={rTop} ticks={[10, (10 + rTop) / 2, rTop]} fmt={R.rev.fmt} />
            : <Bars h={240} values={R.rev.values} labels={R.rev.labels} max={rTop} ticks={[0, rTop / 2, rTop]} fmt={R.rev.fmt} hi={[R.rev.values.length - 1]} bw={range === 'This month' ? 14 : 30} />}
        </Card>
        <Card>
          <CardHead title="Renewal rate" sub="Members renewing within 7 days of expiry" />
          <div className="row" style={{ justifyContent: 'center', padding: '4px 0' }}><Ring value={renewalRate} size={150} sw={14} label={`${renewalRate}%`} sub="+4 pts vs last year" fs={32} /></div>
          <div className="col" style={{ gap: 12 }}>
            {RENEWAL_BY_PLAN.map(([p, v]) => (
              <div key={p} className="grid" style={{ gridTemplateColumns: '90px minmax(0, 1fr) 40px', alignItems: 'center', gap: 12, fontSize: 13 }}>
                <span style={{ color: 'var(--tx2)', fontWeight: 600 }}>{p}</span><Progress value={v} /><span className="num" style={{ fontWeight: 700, textAlign: 'right' }}>{v}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="span2">
          <CardHead title="Membership growth" sub="New members vs members lost" right={<Legend items={[['New', ACC], ['Lost', GRAY]]} />} />
          <Grouped h={220} labels={growth.labels} max={Math.ceil(Math.max(...growth.n, ...growth.l) / 20) * 20 || 10} ticks={[0, Math.ceil(Math.max(...growth.n, ...growth.l) / 20) * 10, Math.ceil(Math.max(...growth.n, ...growth.l) / 20) * 20]} bw={14} series={[{ name: 'New', color: ACC, values: growth.n }, { name: 'Lost', color: GRAY, values: growth.l }]} />
          <div style={{ fontSize: 13, color: 'var(--tx3)' }}>{range === 'This year' ? <>Net growth <span style={{ color: 'var(--tx)', fontWeight: 700 }}>+{newArr.reduce((s, v) => s + v, 0) - lostArr.reduce((s, v) => s + v, 0)} members</span> in 12 months. January’s spike came from the New Year offer.</> : <>September so far: <span style={{ color: 'var(--tx)', fontWeight: 700 }}>{newSep} joined</span>, {lostSep} lapsed.</>}</div>
        </Card>
        <Card>
          <CardHead title="Lead conversion" sub="All leads this month" />
          <div className="row" style={{ alignItems: 'baseline', gap: 8 }}><span className="num" style={{ fontSize: 30, fontWeight: 700 }}>{conv}%</span><span style={{ fontSize: 12 }}><Delta>3.2 pts</Delta></span></div>
          <div className="col" style={{ gap: 8 }}>
            {FUN.map(([s, n], i) => (
              <div key={s} className="col" style={{ gap: 4 }}>
                <div className="row between" style={{ fontSize: 12 }}><span style={{ color: 'var(--tx2)', fontWeight: 600 }}>{s}</span><span className="num" style={{ fontWeight: 700 }}>{n}</span></div>
                <Progress value={(n / leads.length) * 100} color={i === FUN.length - 1 ? undefined : 'var(--gray)'} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHead title="Attendance trend" sub={range === 'Today' ? 'Avg check-ins by hour' : range === 'This year' ? 'Average daily check-ins' : 'Daily check-ins'} />
          <Line h={200} series={[{ name: 'Check-ins', color: ACC, values: att.v }]} labels={att.labels} min={attMin} max={attMax} ticks={[attMin, (attMin + attMax) / 2, attMax]} labelEvery={att.every} pl={34} />
          <div style={{ fontSize: 13, color: 'var(--tx3)' }}>Mornings grew fastest: <span style={{ color: 'var(--tx)', fontWeight: 700 }}>6–8 AM +18%</span> since April.</div>
        </Card>
        <section className="table-card span2">
          <div className="tc-head"><CardHead title="Trainer performance" sub="September" /></div>
          <table className="tbl dense">
            <thead><tr><th>Trainer</th><th className="r">Members</th><th className="r">PT sessions</th><th className="r">Retention</th><th className="r">PT revenue</th><th className="r">Rating</th></tr></thead>
            <tbody>{tRows.map(({ t, mem, pt, ret, rev: r }) => (
              <tr key={t.id}><td><Person name={t.name} sub={t.specialization} size={30} /></td><td className="r"><Num>{count(mem)}</Num></td><td className="r"><Num>{pt}</Num></td><td className="r"><Num>{ret}%</Num></td><td className="r"><Num>{inr(r)}</Num></td><td className="r"><span className="row" style={{ gap: 4, justifyContent: 'flex-end' }}><Num>{t.rating}</Num><Icon name="star" size={13} color="var(--warn)" stroke={2} /></span></td></tr>
            ))}</tbody>
          </table>
        </section>
      </div>
    </>
  );
}
