import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { MemberPicker } from '../components/modals';
import { Avatar, Badge, Btn, Card, CardHead, Field, KV, Modal, PageHead, Person } from '../components/ui';
import type { Member, Trainer } from '../data/types';
import { TODAY, addDays, fmtShort, fmtTime, weekday } from '../lib/date';
import { count, inr } from '../lib/format';
import { canEdit } from '../store/auth';
import { isToday } from '../store/selectors';
import { now, useStore } from '../store/store';

const STATUS_KIND = { Available: 'ok', 'In session': 'info', 'Off today': 'neutral' } as const;

export default function Trainers() {
  const { trainers, members, sessions, user, toast, saveTrainer, addSession } = useStore();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const own = user!.trainerId;
  const edit = canEdit(user!.role, 'trainers');
  const visible = own ? trainers.filter((t) => t.id === own) : trainers;
  const selId = own ?? params.get('t') ?? trainers[0].id;
  const t = trainers.find((x) => x.id === selId) ?? trainers[0];
  const [modal, setModal] = useState<'' | 'edit' | 'new' | 'session'>('');

  const assigned = members.filter((m) => m.trainerId === t.id);
  const onPt = assigned.filter((m) => m.ptTotal > 0);
  const todays = sessions.filter((s) => s.trainerId === t.id && isToday(s.at)).sort((a, b) => a.at.getTime() - b.at.getTime());
  const upcoming = sessions.filter((s) => s.trainerId === t.id && !isToday(s.at) && s.at > now()).sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 5);
  const nextIdx = todays.findIndex((s) => s.at > now());
  const nextFor = (m: Member) => sessions.filter((s) => s.memberId === m.id && s.at > now()).sort((a, b) => a.at.getTime() - b.at.getTime())[0];
  const featured = [...assigned].sort((a, b) => (nextFor(b) ? 1 : 0) - (nextFor(a) ? 1 : 0) || b.ptTotal - a.ptTotal).slice(0, 6);
  const totalAssigned = trainers.reduce((s, x) => s + members.filter((m) => m.trainerId === x.id).length, 0);
  const totalPt = trainers.reduce((s, x) => s + x.ptSessionsMonth, 0);

  const card = (x: Trainer) => {
    const on = x.id === t.id;
    const mem = members.filter((m) => m.trainerId === x.id).length;
    return (
      <section key={x.id} className="card" style={{ borderColor: on ? 'var(--accent)' : undefined, cursor: 'pointer' }} onClick={() => !own && setParams({ t: x.id }, { replace: true })}>
        <div className="row between" style={{ alignItems: 'flex-start' }}><Avatar name={x.name} size={56} /><Badge kind={STATUS_KIND[x.status]}>{x.status}</Badge></div>
        <div className="col" style={{ gap: 4 }}><span className="display" style={{ fontSize: 19, fontWeight: 700 }}>{x.name}</span><span style={{ fontSize: 13, color: 'var(--tx3)' }}>{x.specialization}</span></div>
        <div className="grid g3" style={{ gap: 8, padding: '14px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          {[['Members', count(mem)], ['PT · Sep', String(x.ptSessionsMonth)], ['Rating', String(x.rating)]].map(([l, v], j) => (
            <div key={l} className="col" style={{ gap: 4 }}><span style={{ fontSize: 11, color: 'var(--tx3)' }}>{l}</span><span className="num row" style={{ fontSize: 18, fontWeight: 700, gap: 4 }}>{v}{j === 2 && <Icon name="star" size={14} color="var(--warn)" stroke={2} />}</span></div>
          ))}
        </div>
        <div className="row" style={{ gap: 8, fontSize: 12, color: 'var(--tx3)' }}><Icon name="clock" size={15} />{x.availability}</div>
        <Btn size="sm" v={on ? 'primary' : 'secondary'}>{on ? 'Viewing profile' : 'View profile'}</Btn>
      </section>
    );
  };

  return (
    <>
      <PageHead title={own ? 'My profile' : 'Trainers'} sub={own ? `${assigned.length} members assigned · ${t.ptSessionsMonth} PT sessions in September` : `${trainers.length} trainers · ${count(totalAssigned)} members assigned · ${totalPt} PT sessions in September`}
        right={<>
          <Btn icon="calendar" onClick={() => setModal('session')}>{own ? 'Book session' : 'Schedule'}</Btn>
          {edit && !own && <Btn v="primary" icon="plus" onClick={() => setModal('new')}>Add trainer</Btn>}
        </>} />
      <div className="grid g4">{visible.map(card)}</div>
      <div className="row" style={{ gap: 16, paddingTop: 8, flexWrap: 'wrap' }}>
        <Avatar name={t.name} size={40} />
        <div className="col" style={{ gap: 2 }}><h2 className="display" style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{t.name}</h2><span style={{ fontSize: 13, color: 'var(--tx3)' }}>{t.title} · {t.specialization}</span></div>
        <span className="grow" />
        {!own && <Btn icon="message" onClick={() => toast(`WhatsApp opened for ${t.name} (${t.phone})`, 'info')}>Message</Btn>}
        {(edit || own) && <Btn icon="edit" onClick={() => setModal('edit')}>{own ? 'Edit my profile' : 'Edit trainer'}</Btn>}
      </div>
      <div className="grid g3 stack-md" style={{ alignItems: 'start' }}>
        <div className="col" style={{ gap: 16 }}>
          <Card>
            <CardHead title="Profile" />
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--tx2)' }}>{t.bio}</p>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>{t.certs.map((c) => <Badge key={c} dot={false}>{c}</Badge>)}</div>
            <div className="col" style={{ gap: 12 }}>
              <KV k="Phone" v={<span className="num">{t.phone}</span>} />
              <KV k="Joined" v={t.joined} />
              <KV k="Member retention" v={`${t.retention}%`} />
              {user!.role !== 'frontdesk' && <KV k="PT revenue · Sep" v={inr(t.ptSessionsMonth * t.ptRate)} />}
            </div>
          </Card>
          <Card>
            <CardHead title="Upcoming PT sessions" sub="Next few days" />
            <div className="col" style={{ gap: 10 }}>
              {upcoming.map((s) => (
                <div key={s.id} className="row" style={{ gap: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--sunk)', border: '1px solid var(--line)' }}>
                  <span style={{ width: 52, fontSize: 12, fontWeight: 800, color: 'var(--tx2)' }}>{weekday(s.at)} {s.at.getDate()}</span>
                  <span className="num" style={{ width: 64, fontSize: 12, color: 'var(--tx3)' }}>{fmtTime(s.at)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{s.title.replace(/^PT · /, '')}</span>
                </div>
              ))}
              {!upcoming.length && <span className="muted" style={{ fontSize: 13 }}>Nothing booked yet.</span>}
            </div>
          </Card>
        </div>
        <Card>
          <CardHead title="Assigned members" sub={`${assigned.length} members · ${onPt.length} on PT`} right={<button type="button" className="link" onClick={() => nav(own ? '/members' : `/members`)}>View all</button>} />
          <div className="col">
            {featured.map((m, i) => {
              const n = nextFor(m);
              return (
                <div key={m.id} className="row between" style={{ padding: '11px 0', borderTop: i ? '1px solid var(--line)' : undefined, paddingTop: i ? 11 : 0 }}>
                  <Person name={m.name} sub={`${m.planLabel}${m.ptTotal ? ` · ${m.ptUsed} / ${m.ptTotal} sessions` : ''}`} size={32} onClick={() => nav(`/members/${m.id}`)} />
                  <span style={{ fontSize: 12, color: 'var(--tx3)', whiteSpace: 'nowrap' }}>{n ? `${isToday(n.at) ? 'Today' : weekday(n.at)} ${fmtTime(n.at).replace(':00', '')}` : '—'}</span>
                </div>
              );
            })}
            {!featured.length && <span className="muted" style={{ fontSize: 13 }}>No members assigned yet.</span>}
          </div>
        </Card>
        <Card>
          <CardHead title="Today’s schedule" sub="Thursday, 24 Sep" right={<Btn size="sm" icon="plus" onClick={() => setModal('session')}>Add session</Btn>} />
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }} className="col">
            {todays.map((s, i) => {
              const done = s.at < now() && i !== nextIdx;
              const next = i === nextIdx;
              return (
                <li key={s.id} className="grid" style={{ gridTemplateColumns: '70px 16px minmax(0, 1fr)', gap: 12, alignItems: 'start' }}>
                  <span className="num" style={{ fontSize: 12, fontWeight: 600, color: done ? 'var(--tx3)' : 'var(--tx)', paddingTop: 2 }}>{fmtTime(s.at)}</span>
                  <span className="col" style={{ alignItems: 'center', height: '100%' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 4, background: next ? 'var(--accent)' : done ? '#433E37' : 'var(--card)', border: `2px solid ${done ? '#433E37' : 'var(--accent)'}` }} />
                    {i < todays.length - 1 && <span style={{ flexGrow: 1, width: 2, background: 'var(--line2)', minHeight: 30 }} />}
                  </span>
                  <div className="col" style={{ gap: 2, paddingBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: done ? 'var(--tx3)' : 'var(--tx)' }}>{s.title}{next && <span style={{ marginLeft: 8 }}><Badge kind="accent" dot={false}>Next</Badge></span>}</span>
                    <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{s.sub}</span>
                  </div>
                </li>
              );
            })}
            {!todays.length && <span className="muted" style={{ fontSize: 13 }}>Nothing scheduled today.</span>}
          </ol>
        </Card>
      </div>
      {(modal === 'edit' || modal === 'new') && <TrainerModal trainer={modal === 'edit' ? t : null} onClose={() => setModal('')} onSave={(x) => { saveTrainer(x); setModal(''); if (modal === 'new') setParams({ t: x.id }); }} />}
      {modal === 'session' && <SessionModal trainer={t} onClose={() => setModal('')} onSave={(s) => { addSession(s); setModal(''); }} />}
    </>
  );
}

function TrainerModal({ trainer, onClose, onSave }: { trainer: Trainer | null; onClose: () => void; onSave: (t: Trainer) => void }) {
  const [f, setF] = useState({ name: trainer?.name ?? '', specialization: trainer?.specialization ?? '', phone: trainer?.phone ?? '+91 ', availability: trainer?.availability ?? 'Mon–Sat · 6–11 AM', status: trainer?.status ?? 'Available', bio: trainer?.bio ?? '' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const ok = f.name.trim().split(' ').length >= 2 && f.specialization.trim();
  const save = () => onSave({
    ...(trainer ?? { id: `t-${Date.now()}`, title: 'Trainer', rating: 5, joined: 'Sep 2026', certs: [], retention: 100, ptSessionsMonth: 0, ptRate: 1000 }),
    name: f.name.trim(), specialization: f.specialization.trim(), phone: f.phone, availability: f.availability, status: f.status as Trainer['status'], bio: f.bio,
  });
  return (
    <Modal wide title={trainer ? `Edit ${trainer.name}` : 'Add trainer'} onClose={onClose} foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" disabled={!ok} onClick={save}>{trainer ? 'Save' : 'Add trainer'}</Btn></>}>
      <div className="grid g2">
        <Field label="Full name" id="tr-name"><input id="tr-name" className="input lg" value={f.name} onChange={set('name')} /></Field>
        <Field label="Specialization" id="tr-spec"><input id="tr-spec" className="input lg" value={f.specialization} onChange={set('specialization')} placeholder="Strength & conditioning" /></Field>
        <Field label="Phone" id="tr-phone"><input id="tr-phone" className="input lg num" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Status today" id="tr-status"><select id="tr-status" className="input lg" value={f.status} onChange={set('status')}><option>Available</option><option>In session</option><option>Off today</option></select></Field>
      </div>
      <Field label="Availability" id="tr-av"><input id="tr-av" className="input lg" value={f.availability} onChange={set('availability')} /></Field>
      <Field label="Bio" id="tr-bio"><textarea id="tr-bio" className="input" rows={3} style={{ height: 'auto', padding: 12 }} value={f.bio} onChange={set('bio')} /></Field>
    </Modal>
  );
}

function SessionModal({ trainer, onClose, onSave }: { trainer: Trainer; onClose: () => void; onSave: (s: { trainerId: string; memberId?: string; title: string; sub: string; at: Date }) => void }) {
  const { trainers, user } = useStore();
  const [tid, setTid] = useState(trainer.id);
  const [m, setM] = useState<Member | null>(null);
  const [kind, setKind] = useState('PT');
  const [focus, setFocus] = useState('');
  const [dayOff, setDayOff] = useState('0');
  const [time, setTime] = useState('18:00');
  const [h, mi] = time.split(':').map(Number);
  const base = addDays(TODAY, Number(dayOff));
  const at = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, mi);
  const needsMember = kind === 'PT' || kind === 'Assessment';
  const ok = (!needsMember || m) && at > now();
  return (
    <Modal title="Book a session" sub="Shows in the trainer’s schedule and the member’s app" onClose={onClose}
      foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" disabled={!ok} onClick={() => onSave({ trainerId: tid, memberId: m?.id, title: needsMember ? `${kind} · ${m!.name}` : `Group · ${focus || 'Class'}`, sub: focus || (kind === 'Assessment' ? 'Body composition' : 'Session'), at })}>Book {fmtShort(at)}, {fmtTime(at)}</Btn></>}>
      {!user!.trainerId && <Field label="Trainer" id="ss-tr"><select id="ss-tr" className="input lg" value={tid} onChange={(e) => setTid(e.target.value)}>{trainers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>}
      <Field label="Type" id="ss-kind"><select id="ss-kind" className="input lg" value={kind} onChange={(e) => setKind(e.target.value)}><option>PT</option><option>Assessment</option><option>Group</option></select></Field>
      {needsMember && <Field label="Member" id="pick-member"><MemberPicker value={m} onChange={setM} filter={user!.trainerId ? (x) => x.trainerId === user!.trainerId : undefined} /></Field>}
      <Field label={needsMember ? 'Focus' : 'Class name'} id="ss-focus"><input id="ss-focus" className="input lg" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder={needsMember ? 'Leg day' : 'Evening HIIT'} /></Field>
      <div className="grid g2">
        <Field label="Day" id="ss-day"><select id="ss-day" className="input lg" value={dayOff} onChange={(e) => setDayOff(e.target.value)}>{[0, 1, 2, 3, 4].map((d) => <option key={d} value={d}>{d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${weekday(addDays(TODAY, d))} ${addDays(TODAY, d).getDate()} Sep`}</option>)}</select></Field>
        <Field label="Time" id="ss-time"><input id="ss-time" type="time" className="input lg" value={time} onChange={(e) => setTime(e.target.value)} step={900} /></Field>
      </div>
      {!(at > now()) && <span className="err-msg" style={{ fontSize: 12, color: 'var(--bad)', fontWeight: 600 }}>Pick a time later than now.</span>}
    </Modal>
  );
}
