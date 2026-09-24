import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Line, Ring } from '../components/charts';
import { Icon } from '../components/Icon';
import { NoAccess } from '../components/Layout';
import { METHOD_ICON, RecordPaymentModal, RenewModal } from '../components/modals';
import { Avatar, Badge, Btn, Card, CardHead, Delta, Field, IconBtn, KV, Legend, Modal, Num, Person, Progress, SelectBox, Tabs, Wordmark, Empty } from '../components/ui';
import type { Member } from '../data/types';
import { TODAY, daysBetween, fmtDate, fmtMonth, fmtShort, relTime } from '../lib/date';
import { inr } from '../lib/format';
import { access, canEdit, canSee } from '../store/auth';
import { STATUS_KIND, isToday, memberStatus, openInvoice, planOf } from '../store/selectors';
import { now, useStore } from '../store/store';

const TABS = ['Overview', 'Membership', 'Attendance', 'Payments', 'Workout', 'Nutrition', 'Progress', 'Notes'] as const;
type Tab = (typeof TABS)[number];

function Silhouette({ i }: { i: number }) {
  const s = [1.06, 1.0, 0.95][i] ?? 1;
  return (
    <svg width="120" height="170" viewBox="0 0 120 170" aria-hidden="true">
      <g fill="#322F2A"><circle cx="60" cy="30" r="17" /><path d={`M${60 - 34 * s} 170 L${60 - 30 * s} 78 Q${60 - 28 * s} 56 48 54 L72 54 Q${60 + 28 * s} 56 ${60 + 30 * s} 78 L${60 + 34 * s} 170 Z`} /></g>
    </svg>
  );
}

function nutritionFor(m: Member) {
  const w = m.measurements[m.measurements.length - 1]?.weight ?? 70;
  const goal = m.programId === 'p-fatloss' ? 'Fat loss plan' : m.programId === 'p-muscle' ? 'Lean bulk plan' : 'Maintenance plan';
  const kcal = Math.round((w * (m.programId === 'p-fatloss' ? 26 : m.programId === 'p-muscle' ? 33 : 30)) / 50) * 50;
  return { goal, kcal, protein: Math.round(w * 2), carbs: Math.round((kcal * 0.45) / 4), fats: Math.round((kcal * 0.25) / 9) };
}

export default function MemberProfile() {
  const { id } = useParams();
  const store = useStore();
  const { members, invoices, checkIns, trainers, programs, sessions, user, updateMember, freezeMember, addNote, addMeasurement, assignProgram, remind } = store;
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('Overview');
  const [modal, setModal] = useState<'' | 'renew' | 'pay' | 'edit' | 'freeze' | 'measure' | 'upgrade'>('');
  const m = members.find((x) => x.id === id);
  const role = user!.role;
  if (!m) return <Empty>Member {id} not found. <button type="button" className="link" onClick={() => nav('/members')}>Back to members</button></Empty>;
  if (access(role, 'profile') === 'own' && m.trainerId !== user!.trainerId) return <NoAccess screen="this member (not assigned to you)" />;
  const edit = canEdit(role, 'profile') && role !== 'trainer';
  const money = canSee(role, 'payments');
  const st = memberStatus(m);
  const trainer = trainers.find((t) => t.id === m.trainerId);
  const inGym = checkIns.some((c) => c.memberId === m.id && !c.out && isToday(c.in));
  const plan = planOf(m.planId)!;
  const total = daysBetween(m.start, m.expiry);
  const left = daysBetween(TODAY, m.expiry);
  const mine = invoices.filter((i) => i.memberId === m.id);
  const open = openInvoice(m, invoices);
  const program = programs.find((p) => p.id === m.programId);
  const nextSession = sessions.filter((s) => s.memberId === m.id && s.at > now()).sort((a, b) => a.at.getTime() - b.at.getTime())[0];
  const meas = m.measurements;
  const first = meas[0], last = meas[meas.length - 1];
  const bmi = last ? +(last.weight / (m.heightCm / 100) ** 2).toFixed(1) : 0;
  const bmi0 = first ? +(first.weight / (m.heightCm / 100) ** 2).toFixed(1) : 0;
  const nut = nutritionFor(m);
  const planned = Math.round(TODAY.getDate() * 0.8);
  const attPct = Math.min(100, Math.round((m.visitsThisMonth / planned) * 100));
  const completion = Math.min(100, Math.round((m.visitsThisMonth / Math.max(1, planned)) * 100));

  const crumb = (
    <nav aria-label="Breadcrumb" className="row" style={{ gap: 6, fontSize: 13, color: 'var(--tx3)' }}>
      {canSee(role, 'members') ? <button type="button" onClick={() => nav(-1)} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 600, padding: 0 }}>Members</button> : <span>Members</span>}
      <Icon name="chevright" size={14} /><span style={{ color: 'var(--tx2)', fontWeight: 600 }}>{m.name}</span>
    </nav>
  );

  const header = (
    <section className="card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
      <div className="row" style={{ gap: 20 }}>
        <div style={{ position: 'relative' }}>
          <Avatar name={m.name} size={80} />
          {inGym && <span title="In the gym now" style={{ position: 'absolute', right: 2, bottom: 4, width: 16, height: 16, borderRadius: '50%', background: 'var(--ok)', border: '3px solid var(--card)' }} />}
        </div>
        <div className="col" style={{ gap: 10 }}>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <h1 className="display" style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em' }}>{m.name}</h1>
            <Badge kind={STATUS_KIND[st]}>{st}</Badge>
            {inGym && <Badge dot={false}>In gym now</Badge>}
            {m.frozenUntil && m.frozenUntil > now() && <Badge kind="info">Frozen till {fmtShort(m.frozenUntil)}</Badge>}
          </div>
          <div className="row" style={{ gap: 16, fontSize: 13, color: 'var(--tx3)', flexWrap: 'wrap' }}>
            <span className="num" style={{ color: 'var(--tx2)', fontWeight: 600 }}>{m.id}</span><span>·</span><span>Member since {fmtMonth(m.joinDate)}</span><span>·</span><span>{m.planLabel}</span>
            {trainer && <><span>·</span><span>Trainer: <span style={{ color: 'var(--tx2)', fontWeight: 600 }}>{trainer.name}</span></span></>}
          </div>
        </div>
      </div>
      <div className="row" style={{ gap: 10 }}>
        {edit && <Btn icon="edit" onClick={() => setModal('edit')}>Edit</Btn>}
        {money && <Btn icon="receipt" onClick={() => setModal('pay')}>Record payment</Btn>}
        {edit && <Btn v="primary" icon="refresh" onClick={() => setModal('renew')}>Renew membership</Btn>}
      </div>
    </section>
  );

  const membershipCard = (
    <section className="card" style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg0)', borderColor: 'var(--line2)' }}>
      <div aria-hidden="true" className="outline29" style={{ right: -20, top: -44, fontSize: 180 }}>29</div>
      <div className="row between" style={{ position: 'relative' }}>
        <span className="row" style={{ gap: 10 }}><img src="/club29-logo.jpg" alt="" width={36} height={36} style={{ borderRadius: 8 }} /><span className="col" style={{ gap: 3 }}><Wordmark size={15} /><span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--accent)' }}>MEMBER CARD</span></span></span>
        {money ? <Badge kind={open ? (open.status === 'Pending' ? 'warn' : 'bad') : 'ok'} dot={false}>{open ? open.status : m.autopay ? 'Auto-pay' : 'Paid'}</Badge> : <Badge kind={STATUS_KIND[st]} dot={false}>{st}</Badge>}
      </div>
      <div className="col" style={{ position: 'relative', gap: 4 }}><span style={{ fontSize: 12, color: 'var(--tx3)' }}>Current plan</span><span className="display" style={{ fontSize: 22, fontWeight: 700 }}>{m.planLabel}{m.ptTotal ? ` · PT ${m.ptTotal}` : ''}</span></div>
      <div className="grid g2" style={{ position: 'relative', gap: 12 }}>
        <div className="col" style={{ gap: 4 }}><span style={{ fontSize: 12, color: 'var(--tx3)' }}>Start date</span><span style={{ fontSize: 14, fontWeight: 700 }}>{fmtDate(m.start)}</span></div>
        <div className="col" style={{ gap: 4 }}><span style={{ fontSize: 12, color: 'var(--tx3)' }}>Expiry date</span><span style={{ fontSize: 14, fontWeight: 700 }}>{fmtDate(m.expiry)}</span></div>
      </div>
      <div className="col" style={{ position: 'relative', gap: 8 }}>
        <div className="row between" style={{ fontSize: 13 }}>
          <span style={{ color: 'var(--tx2)', fontWeight: 600 }}>{left >= 0 ? <><span className="num" style={{ color: 'var(--accent)', fontWeight: 700 }}>{left}</span> days remaining</> : <span style={{ color: 'var(--bad)', fontWeight: 700 }}>Expired {-left} days ago</span>}</span>
          <span style={{ color: 'var(--tx3)' }}>{Math.min(total, total - left)} / {total}</span>
        </div>
        <Progress value={((total - left) / total) * 100} color={left < 0 ? 'var(--bad)' : undefined} />
      </div>
      {edit && (
        <div className="row" style={{ position: 'relative', gap: 8 }}>
          <Btn size="sm" v="primary" icon="refresh" onClick={() => setModal('renew')}>Renew</Btn>
          <Btn size="sm" onClick={() => setModal('freeze')} disabled={left < 0}>Freeze</Btn>
          <Btn size="sm" v="ghost" onClick={() => setModal('upgrade')} disabled={m.planId === 'annual'}>Upgrade</Btn>
        </div>
      )}
    </section>
  );

  const profileCard = (
    <Card>
      <CardHead title="Profile" right={edit ? <IconBtn sm icon="edit" label="Edit profile" onClick={() => setModal('edit')} /> : undefined} />
      <div className="col" style={{ gap: 14 }}>
        <KV k="Phone" v={<span className="num">{m.phone}</span>} />
        <KV k="Email" v={m.email} />
        <KV k="Date of birth" v={`${fmtDate(m.dob)} · ${Math.floor(daysBetween(m.dob, TODAY) / 365.25)} yrs`} />
        <KV k="Gender" v={m.gender} />
        <KV k="Joining date" v={fmtDate(m.joinDate)} />
      </div>
      <div className="tile" style={{ gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--tx3)' }}>Emergency contact</span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{m.emergency.name} · {m.emergency.relation}</span>
        <span className="num" style={{ fontSize: 13, color: 'var(--tx2)' }}>{m.emergency.phone}</span>
      </div>
    </Card>
  );

  const trainerCard = (
    <Card>
      <CardHead title="Trainer" />
      {trainer ? (
        <>
          <Person name={trainer.name} sub={`${trainer.specialization} · ${trainer.rating} rating`} size={44} onClick={canSee(role, 'trainers') ? () => nav(`/trainers?t=${trainer.id}`) : undefined} />
          {m.ptTotal > 0 && (
            <div className="col" style={{ gap: 8 }}>
              <div className="row between" style={{ fontSize: 13 }}><span style={{ color: 'var(--tx3)' }}>PT sessions used</span><span className="num" style={{ fontWeight: 700 }}>{m.ptUsed} / {m.ptTotal}</span></div>
              <Progress value={(m.ptUsed / m.ptTotal) * 100} />
            </div>
          )}
          <div className="row" style={{ gap: 12, padding: '14px 16px', borderRadius: 10, background: 'var(--accent-soft)' }}>
            <Icon name="calendar" size={18} color="var(--accent)" />
            <div className="col" style={{ gap: 2 }}>
              <span style={{ fontSize: 12, color: 'var(--tx2)' }}>Next session</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{nextSession ? `${isToday(nextSession.at) ? 'Today' : fmtShort(nextSession.at)}, ${nextSession.at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} · ${nextSession.sub}` : 'Not booked yet'}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="col" style={{ gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--tx3)' }}>No trainer assigned.</span>
          {edit && <SelectBox label="Assign trainer" value="" width={260} onChange={(v) => { if (v) { updateMember(m.id, { trainerId: v, programId: m.programId ?? 'p-general' }); store.toast(`${trainers.find((t) => t.id === v)!.name} assigned to ${m.name}`); } }} options={[['', 'Assign a trainer…'], ...trainers.map((t) => [t.id, `${t.name} · ${t.specialization}`] as [string, string])]} />}
        </div>
      )}
    </Card>
  );

  const payRow = (i: (typeof mine)[number], idx: number) => (
    <div key={i.id} className="list-row" style={idx ? undefined : { borderTop: 'none', paddingTop: 0 }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--card2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx2)' }}><Icon name="receipt" size={16} /></span>
      <div className="col grow" style={{ gap: 2 }}><span style={{ fontSize: 14, fontWeight: 700 }}>{i.item}</span><span style={{ fontSize: 12, color: 'var(--tx3)' }}>{i.id} · {i.method ?? i.status} · {fmtDate(i.date)}</span></div>
      <span className="num" style={{ fontSize: 14, fontWeight: 700, color: i.status === 'Paid' ? 'var(--tx)' : i.status === 'Pending' ? 'var(--warn)' : 'var(--bad)' }}>{inr(i.amount)}</span>
    </div>
  );
  const paymentsCard = money && (
    <Card>
      <CardHead title="Recent payments" right={<button type="button" className="link" onClick={() => setTab('Payments')}>All payments</button>} />
      <div className="col">{mine.slice(0, 3).map(payRow)}{!mine.length && <span className="muted" style={{ fontSize: 13 }}>No payments yet.</span>}</div>
    </Card>
  );

  // ---------- tab content ----------
  const metric = (l: string, v: number | string, u: string, d: number, goodDown = true) => (
    <div className="tile">
      <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{l}</span>
      <span className="row" style={{ alignItems: 'baseline', gap: 4 }}><span className="num" style={{ fontSize: 22, fontWeight: 700 }}>{v}</span><span style={{ fontSize: 12, color: 'var(--tx3)' }}>{u}</span></span>
      <span style={{ fontSize: 12 }}>{d === 0 ? <span className="muted">No change</span> : <><Delta down={d < 0} good={goodDown ? d < 0 : d > 0}>{d > 0 ? '+' : '−'}{Math.abs(+d.toFixed(1))}</Delta><span className="muted"> since {first ? fmtMonth(first.date).split(' ')[0] : ''}</span></>}</span>
    </div>
  );
  const progressCard = (
    <Card>
      <CardHead title="Fitness progress" sub={last ? `Last assessment: ${fmtDate(last.date)}${trainer ? ` by ${trainer.name}` : ''}` : 'No assessment yet'} right={(edit || role === 'trainer') && <Btn size="sm" icon="plus" onClick={() => setModal('measure')}>Add measurement</Btn>} />
      {last ? (
        <>
          <div className="grid g3" style={{ gap: 10 }}>
            {metric('Weight', last.weight, 'kg', last.weight - first.weight)}
            {metric('Body fat', last.bodyFat, '%', last.bodyFat - first.bodyFat)}
            {metric('BMI', bmi, '', bmi - bmi0)}
            {metric('Waist', last.waist, 'cm', last.waist - first.waist)}
            {metric('Chest', last.chest, 'cm', last.chest - first.chest, false)}
            {metric('Arms', last.arms, 'cm', last.arms - first.arms, false)}
          </div>
          <div className="col" style={{ gap: 10 }}>
            <div className="row between"><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx2)' }}>Weight history</span><Legend items={[['Weight (kg)', '#F5A01E']]} /></div>
            <Line h={180} series={[{ name: 'Weight', color: '#F5A01E', area: true, values: meas.map((x) => x.weight) }]} labels={meas.map((x) => fmtMonth(x.date).slice(0, 3))} min={Math.floor(Math.min(...meas.map((x) => x.weight)) - 2)} max={Math.ceil(Math.max(...meas.map((x) => x.weight)) + 2)} ticks={[Math.floor(Math.min(...meas.map((x) => x.weight)) - 2), Math.ceil(Math.max(...meas.map((x) => x.weight)) + 2)]} fmt={(v) => `${v}`} pl={32} />
          </div>
        </>
      ) : <Empty>Add the first measurement to start tracking progress.</Empty>}
    </Card>
  );

  const calendar = (
    <div className="col" style={{ gap: 6 }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--tx3)' }}>{d}</div>)}</div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
        <div />
        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
          const v = m.visitDays.includes(d), fut = d > TODAY.getDate(), today = d === TODAY.getDate();
          return <div key={d} title={`${d} Sep${v ? ' · visited' : ''}`} className="num" style={{ height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: v ? 700 : 500, background: v ? 'var(--accent)' : fut ? 'transparent' : '#25221E', color: v ? 'var(--ink)' : fut ? '#5A554E' : 'var(--tx3)', boxShadow: today ? '0 0 0 2px var(--card), 0 0 0 3px var(--tx)' : undefined }}>{d}</div>;
        })}
      </div>
    </div>
  );
  const attendanceCard = (
    <Card>
      <CardHead title="Attendance" sub="September 2026" right={<button type="button" className="link" onClick={() => setTab('Attendance')}>Full log</button>} />
      <div className="grid g3" style={{ gap: 12 }}>
        {[['This month', m.visitsThisMonth, 'visits'], ['Total visits', m.totalVisits, `since ${fmtMonth(m.joinDate)}`], ['Attendance', `${attPct}%`, 'of planned days']].map(([l, v, s]) => (
          <div key={String(l)} className="col" style={{ gap: 4 }}><span style={{ fontSize: 12, color: 'var(--tx3)' }}>{l}</span><span className="num" style={{ fontSize: 24, fontWeight: 700 }}>{v}</span><span style={{ fontSize: 11, color: 'var(--tx3)' }}>{s}</span></div>
        ))}
      </div>
      {calendar}
    </Card>
  );
  const workoutCard = (
    <Card>
      <CardHead title="Workout" sub={program ? `${program.name} · ${program.weeks}` : 'No program assigned'} right={program && canSee(role, 'workouts') ? <button type="button" className="link" onClick={() => nav(`/workouts?p=${program.id}`)}>Open plan</button> : undefined} />
      {program ? (
        <>
          <div className="row" style={{ gap: 16 }}><Ring value={completion} size={76} sw={8} label={`${completion}%`} fs={17} /><div className="col" style={{ gap: 4 }}><span style={{ fontSize: 14, fontWeight: 700 }}>{m.visitsThisMonth} of {planned} workouts done</span><span style={{ fontSize: 12, color: 'var(--tx3)' }}>in September · logged in app</span></div></div>
          <div className="col" style={{ gap: 8 }}>
            {program.days.slice(0, 3).map((d, i) => (
              <div key={d.name} className="row" style={{ gap: 12, fontSize: 13 }}><span style={{ width: 44, color: i === 0 ? 'var(--accent)' : 'var(--tx3)', fontWeight: 700 }}>{['Today', 'Fri', 'Sat'][i]}</span><span className="grow" style={{ fontWeight: 700 }}>{d.focus}</span><span style={{ color: 'var(--tx3)' }}>{d.exercises.length} exercises</span></div>
            ))}
          </div>
        </>
      ) : <span className="muted" style={{ fontSize: 13 }}>Assign a program from the Workout tab.</span>}
    </Card>
  );
  const macro = (l: string, v: string, t: string) => (
    <div className="col" style={{ gap: 6 }}><div className="row between" style={{ fontSize: 12 }}><span style={{ color: 'var(--tx2)', fontWeight: 600 }}>{l}</span><span className="num muted"><span style={{ color: 'var(--tx)', fontWeight: 700 }}>{v}</span> / {t}</span></div><Progress h={5} value={100} /></div>
  );
  const nutritionCard = (
    <Card>
      <CardHead title="Nutrition" sub={`${nut.goal} · by Meera Nair`} />
      <div className="row" style={{ alignItems: 'baseline', gap: 6 }}><span className="num" style={{ fontSize: 24, fontWeight: 700 }}>{nut.kcal.toLocaleString('en-IN')}</span><span style={{ fontSize: 13, color: 'var(--tx3)' }}>kcal / day target</span></div>
      {macro('Protein', `${nut.protein} g`, `${Math.round((nut.protein * 4 / nut.kcal) * 100)}%`)}{macro('Carbs', `${nut.carbs} g`, '45%')}{macro('Fats', `${nut.fats} g`, '25%')}
      <div style={{ fontSize: 12, color: 'var(--tx3)' }}>Logged meals <span style={{ color: 'var(--tx)', fontWeight: 700 }}>{Math.min(7, Math.round(m.visitsThisMonth / 3) + 2)} of 7 days</span> this week</div>
    </Card>
  );
  const photos = (
    <Card>
      <CardHead title="Progress photos" sub={`${Math.min(3, meas.length)} check-ins · front pose`} right={(edit || role === 'trainer') && <Btn size="sm" icon="camera" onClick={() => store.toast('Members upload photos from the Club29 app', 'info')}>Upload</Btn>} />
      <div className="grid g3" style={{ gap: 12 }}>
        {[meas[0], meas[Math.floor(meas.length / 2)], meas[meas.length - 1]].filter(Boolean).slice(0, 3).map((x, i) => (
          <figure key={i} style={{ margin: 0 }} className="col">
            <div role="img" aria-label={`Progress photo placeholder, ${fmtMonth(x.date)}`} style={{ height: 200, borderRadius: 10, background: 'var(--sunk)', border: '1px solid var(--line)', backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}><Silhouette i={i} /></div>
            <figcaption className="row between" style={{ fontSize: 12, marginTop: 8 }}><span style={{ color: 'var(--tx2)', fontWeight: 700 }}>{fmtMonth(x.date)}</span><span className="num muted">{x.weight} kg</span></figcaption>
          </figure>
        ))}
      </div>
    </Card>
  );

  const tabBody = () => {
    switch (tab) {
      case 'Overview':
        return <>{progressCard}<div className="grid g2 stack-md">{attendanceCard}<div className="col" style={{ gap: 16 }}>{workoutCard}{nutritionCard}</div></div>{photos}</>;
      case 'Membership':
        return (
          <Card>
            <CardHead title="Membership" sub={`${plan.name} · ${plan.access}`} right={edit && <Btn size="sm" v="primary" icon="refresh" onClick={() => setModal('renew')}>Renew</Btn>} />
            <div className="grid g2" style={{ gap: 16 }}>
              <div className="col" style={{ gap: 12 }}><KV k="Plan" v={m.planLabel} /><KV k="Price" v={inr(plan.price)} /><KV k="Access" v={plan.access} /><KV k="PT sessions" v={m.ptTotal ? `${m.ptUsed} of ${m.ptTotal} used` : 'Not included'} /></div>
              <div className="col" style={{ gap: 12 }}><KV k="Start" v={fmtDate(m.start)} /><KV k="Expiry" v={fmtDate(m.expiry)} /><KV k="Auto-pay" v={m.autopay ? 'On · card' : 'Off'} /><KV k="Status" v={<Badge kind={STATUS_KIND[st]}>{st}</Badge>} /></div>
            </div>
            <div className="divider" />
            <span className="eyebrow">Benefits</span>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="col">{plan.benefits.map((b) => <li key={b} className="row" style={{ gap: 10, fontSize: 13, color: 'var(--tx2)', padding: '4px 0' }}><Icon name="check" size={16} color="var(--accent)" stroke={2.2} />{b}</li>)}</ul>
            {edit && <div className="row" style={{ gap: 8 }}><Btn size="sm" onClick={() => setModal('freeze')} disabled={left < 0}>Freeze membership</Btn><Btn size="sm" onClick={() => { updateMember(m.id, { autopay: !m.autopay }); store.toast(`Auto-pay ${m.autopay ? 'turned off' : 'turned on'} for ${m.name}`, 'info'); }}>{m.autopay ? 'Turn off auto-pay' : 'Turn on auto-pay'}</Btn><Btn size="sm" icon="send" onClick={() => remind([m.id])}>Send renewal reminder</Btn></div>}
          </Card>
        );
      case 'Attendance': {
        const todayIn = checkIns.find((c) => c.memberId === m.id && isToday(c.in));
        return (
          <Card>
            <CardHead title="Attendance" sub="September 2026" />
            <div className="grid g4" style={{ gap: 12 }}>
              <div className="tile"><span className="muted" style={{ fontSize: 12 }}>This month</span><span className="num" style={{ fontSize: 22, fontWeight: 700 }}>{m.visitsThisMonth}</span></div>
              <div className="tile"><span className="muted" style={{ fontSize: 12 }}>Total visits</span><span className="num" style={{ fontSize: 22, fontWeight: 700 }}>{m.totalVisits}</span></div>
              <div className="tile"><span className="muted" style={{ fontSize: 12 }}>Attendance</span><span className="num" style={{ fontSize: 22, fontWeight: 700 }}>{attPct}%</span></div>
              <div className="tile"><span className="muted" style={{ fontSize: 12 }}>Today</span><span style={{ fontSize: 15, fontWeight: 700 }}>{todayIn ? `In at ${todayIn.in.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}${todayIn.out ? `, out ${todayIn.out.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : ''}` : 'Not checked in'}</span></div>
            </div>
            {calendar}
          </Card>
        );
      }
      case 'Payments':
        if (!money) return <NoAccess screen="payments" />;
        return (
          <section className="table-card">
            <div className="tc-head"><CardHead title="Payments" sub={`${mine.length} invoices · ${inr(mine.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0))} paid`} right={<Btn size="sm" icon="plus" onClick={() => setModal('pay')}>Record payment</Btn>} /></div>
            <table className="tbl"><thead><tr><th>Invoice</th><th>For</th><th>Date</th><th>Method</th><th className="r">Amount</th><th>Status</th></tr></thead>
              <tbody>{mine.map((i) => <tr key={i.id}><td><Num>{i.id}</Num></td><td>{i.item}</td><td>{fmtDate(i.date)}</td><td>{i.method ? <span className="row" style={{ gap: 8 }}><Icon name={METHOD_ICON[i.method]} size={15} color="var(--tx3)" />{i.method}</span> : '—'}</td><td className="r"><Num>{inr(i.amount)}</Num></td><td><Badge kind={i.status === 'Paid' ? 'ok' : i.status === 'Pending' ? 'warn' : 'bad'}>{i.status}</Badge></td></tr>)}</tbody>
            </table>
          </section>
        );
      case 'Workout':
        return (
          <Card>
            <CardHead title="Workout program" sub={program ? `${program.name} · ${program.level} · ${program.daysPerWeek} days / week` : 'No program assigned'}
              right={(canEdit(role, 'workouts') || edit) && <SelectBox label="Assign program" width={220} value={m.programId ?? ''} onChange={(v) => v && assignProgram([m.id], v)} options={[['', 'Assign a program…'], ...programs.map((p) => [p.id, p.name] as [string, string])]} />} />
            {program ? program.days.map((d) => (
              <div key={d.name} className="col" style={{ gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800 }}>{d.name} · {d.focus}</span>
                <div className="col" style={{ gap: 4 }}>{d.exercises.map((e) => <div key={e.name} className="row between" style={{ fontSize: 13, color: 'var(--tx2)', padding: '6px 0', borderBottom: '1px solid var(--line)' }}><span>{e.name}</span><span className="num muted">{e.sets} × {e.reps} · rest {e.rest}</span></div>)}</div>
              </div>
            )) : <Empty>Pick a program above to assign it. The member sees it in the Club29 app.</Empty>}
          </Card>
        );
      case 'Nutrition':
        return <div className="grid g2 stack-md">{nutritionCard}<Card><CardHead title="Sample day" sub="What the member sees in the app" />{[['Breakfast', 'Oats, whey, banana, almonds', 520], ['Lunch', 'Dal, rice, paneer bhurji, salad', 680], ['Snack', 'Greek yogurt, berries', 240], ['Dinner', 'Grilled chicken, 2 rotis, sabzi', 620]].map(([t, d, k]) => <div key={String(t)} className="list-row"><div className="col grow" style={{ gap: 2 }}><span style={{ fontWeight: 700, fontSize: 14 }}>{t}</span><span className="muted" style={{ fontSize: 12 }}>{d}</span></div><span className="num" style={{ fontWeight: 700 }}>{k} kcal</span></div>)}</Card></div>;
      case 'Progress':
        return (
          <>
            {progressCard}
            <section className="table-card">
              <div className="tc-head"><CardHead title="All measurements" /></div>
              <table className="tbl"><thead><tr><th>Date</th><th className="r">Weight</th><th className="r">Body fat</th><th className="r">Waist</th><th className="r">Chest</th><th className="r">Arms</th></tr></thead>
                <tbody>{[...meas].reverse().map((x, i) => <tr key={i}><td>{fmtDate(x.date)}</td><td className="r"><Num>{x.weight} kg</Num></td><td className="r"><Num>{x.bodyFat}%</Num></td><td className="r"><Num>{x.waist} cm</Num></td><td className="r"><Num>{x.chest} cm</Num></td><td className="r"><Num>{x.arms} cm</Num></td></tr>)}</tbody>
              </table>
            </section>
            {photos}
          </>
        );
      case 'Notes':
        return <NotesTab m={m} canWrite={edit || role === 'trainer'} onAdd={(t) => addNote(m.id, t, user!.name)} />;
    }
  };

  return (
    <>
      <div className="col" style={{ gap: 16 }}>{crumb}{header}</div>
      <div className="grid stack-md" style={{ gridTemplateColumns: '340px minmax(0, 1fr)', alignItems: 'start' }}>
        <div className="col" style={{ gap: 16 }}>{membershipCard}{profileCard}{trainerCard}{paymentsCard}</div>
        <div className="col" style={{ gap: 16, minWidth: 0 }}>
          <Tabs items={TABS} value={tab} onChange={setTab} />
          {tabBody()}
        </div>
      </div>

      {modal === 'renew' && <RenewModal member={m} onClose={() => setModal('')} />}
      {modal === 'upgrade' && <RenewModal member={{ ...m, planId: m.planId === 'monthly' ? 'quarterly' : m.planId === 'quarterly' ? 'half' : 'annual' }} onClose={() => setModal('')} />}
      {modal === 'pay' && <RecordPaymentModal member={m} onClose={() => setModal('')} />}
      {modal === 'edit' && <EditMemberModal m={m} onClose={() => setModal('')} onSave={(p) => { updateMember(m.id, p); store.toast(`${m.name}'s profile updated`); setModal(''); }} />}
      {modal === 'freeze' && <FreezeModal m={m} onClose={() => setModal('')} onFreeze={(d) => { freezeMember(m.id, d); setModal(''); }} />}
      {modal === 'measure' && <MeasureModal m={m} onClose={() => setModal('')} onSave={(x) => { addMeasurement(m.id, x); setModal(''); }} />}
    </>
  );
}

function NotesTab({ m, canWrite, onAdd }: { m: Member; canWrite: boolean; onAdd: (t: string) => void }) {
  const [text, setText] = useState('');
  return (
    <Card>
      <CardHead title="Notes" sub="Visible to Club29 staff only" />
      {canWrite && (
        <div className="col" style={{ gap: 10 }}>
          <label htmlFor="note" className="eyebrow">Add a note</label>
          <textarea id="note" className="input" rows={3} style={{ height: 'auto', padding: 12, resize: 'vertical' }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Injury, preferences, follow-up…" />
          <div><Btn v="primary" size="sm" disabled={!text.trim()} onClick={() => { onAdd(text.trim()); setText(''); }}>Save note</Btn></div>
        </div>
      )}
      <div className="col">
        {m.notes.map((n) => (
          <div key={n.id} className="list-row" style={{ alignItems: 'flex-start' }}>
            <Avatar name={n.by} size={32} />
            <div className="col" style={{ gap: 4 }}><span style={{ fontSize: 12, color: 'var(--tx3)' }}><b style={{ color: 'var(--tx2)' }}>{n.by}</b> · {relTime(n.at, now())}</span><span style={{ fontSize: 14, lineHeight: 1.5 }}>{n.text}</span></div>
          </div>
        ))}
        {!m.notes.length && <span className="muted" style={{ fontSize: 13 }}>No notes yet.</span>}
      </div>
    </Card>
  );
}

function EditMemberModal({ m, onClose, onSave }: { m: Member; onClose: () => void; onSave: (p: Partial<Member>) => void }) {
  const [f, setF] = useState({ name: m.name, phone: m.phone, email: m.email, eName: m.emergency.name, eRel: m.emergency.relation, ePhone: m.emergency.phone });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal wide title="Edit member" sub={`${m.name} · ${m.id}`} onClose={onClose} foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" disabled={!f.name.trim()} onClick={() => onSave({ name: f.name.trim(), phone: f.phone, email: f.email, emergency: { name: f.eName, relation: f.eRel, phone: f.ePhone } })}>Save changes</Btn></>}>
      <div className="grid g2">
        <Field label="Full name" id="em-name"><input id="em-name" className="input lg" value={f.name} onChange={set('name')} /></Field>
        <Field label="Mobile" id="em-phone"><input id="em-phone" className="input lg num" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Email" id="em-email"><input id="em-email" className="input lg" value={f.email} onChange={set('email')} /></Field>
        <Field label="Emergency contact" id="em-ename"><input id="em-ename" className="input lg" value={f.eName} onChange={set('eName')} /></Field>
        <Field label="Relation" id="em-erel"><input id="em-erel" className="input lg" value={f.eRel} onChange={set('eRel')} /></Field>
        <Field label="Emergency phone" id="em-ephone"><input id="em-ephone" className="input lg num" value={f.ePhone} onChange={set('ePhone')} /></Field>
      </div>
    </Modal>
  );
}

function FreezeModal({ m, onClose, onFreeze }: { m: Member; onClose: () => void; onFreeze: (days: number) => void }) {
  const max = m.planId === 'annual' ? 30 : m.planId === 'half' ? 15 : 7;
  const [days, setDays] = useState(Math.min(7, max));
  return (
    <Modal title="Freeze membership" sub={`${m.planLabel} allows up to ${max} days`} onClose={onClose} foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" onClick={() => onFreeze(days)}>Freeze {days} days</Btn></>}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>{[7, 15, 30].filter((d) => d <= max).map((d) => <button key={d} type="button" className={`chip${d === days ? ' on' : ''}`} onClick={() => setDays(d)}>{d} days</button>)}</div>
      <div className="row between" style={{ fontSize: 13, color: 'var(--tx3)' }}><span>New expiry</span><span style={{ color: 'var(--tx)', fontWeight: 700 }}>{fmtDate(new Date(m.expiry.getTime() + days * 86400000))}</span></div>
    </Modal>
  );
}

function MeasureModal({ m, onClose, onSave }: { m: Member; onClose: () => void; onSave: (x: { weight: number; bodyFat: number; waist: number; chest: number; arms: number }) => void }) {
  const last = m.measurements[m.measurements.length - 1];
  const [f, setF] = useState({ weight: String(last?.weight ?? ''), bodyFat: String(last?.bodyFat ?? ''), waist: String(last?.waist ?? ''), chest: String(last?.chest ?? ''), arms: String(last?.arms ?? '') });
  const nums = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, Number(v)])) as Record<keyof typeof f, number>;
  const ok = Object.values(nums).every((n) => n > 0);
  return (
    <Modal title="Add measurement" sub={`${m.name} · ${fmtDate(TODAY)}`} onClose={onClose} foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" disabled={!ok} onClick={() => onSave(nums)}>Save</Btn></>}>
      <div className="grid g2">
        {([['weight', 'Weight (kg)'], ['bodyFat', 'Body fat (%)'], ['waist', 'Waist (cm)'], ['chest', 'Chest (cm)'], ['arms', 'Arms (cm)']] as const).map(([k, l]) => (
          <Field key={k} label={l} id={`ms-${k}`}><input id={`ms-${k}`} className="input lg num" inputMode="decimal" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></Field>
        ))}
      </div>
      <span className="muted" style={{ fontSize: 12 }}>Measurements show up in the member’s app.</span>
    </Modal>
  );
}
