import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { MemberPicker } from '../components/modals';
import { Avatar, Badge, Btn, Card, CardHead, Chip, Field, IconBtn, Modal, MoreMenu, Num, PageHead, SearchBox, Tile, Empty } from '../components/ui';
import type { Exercise, Member, Program } from '../data/types';
import { fmtDate } from '../lib/date';
import { count } from '../lib/format';
import { canEdit } from '../store/auth';
import { useStore } from '../store/store';

export default function Workouts() {
  const { programs, members, user, createProgram, duplicateProgram, addExercise, removeExercise, assignProgram, saveProgram, toast } = useStore();
  const [params, setParams] = useSearchParams();
  const edit = canEdit(user!.role, 'workouts');
  const [q, setQ] = useState('');
  const [chip, setChip] = useState<'All' | 'Mine' | 'Templates'>('All');
  const [dayIdx, setDayIdx] = useState(0);
  const [modal, setModal] = useState<'' | 'create' | 'assign' | 'exercise' | 'rename' | 'video'>('');
  const [video, setVideo] = useState<Exercise | null>(null);
  const selId = params.get('p') ?? 'p-muscle';
  const p = programs.find((x) => x.id === selId) ?? programs[0];
  const day = p.days[Math.min(dayIdx, p.days.length - 1)];
  const di = p.days.indexOf(day);
  const select = (id: string) => { setParams({ p: id }, { replace: true }); setDayIdx(0); };
  const assignedCount = (id: string) => members.filter((m) => m.programId === id).length;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return programs.filter((x) => (!s || x.name.toLowerCase().includes(s) || x.level.toLowerCase().includes(s)) && (chip !== 'Mine' || x.createdBy === user!.name) && (chip !== 'Templates' || x.createdBy !== user!.name));
  }, [programs, q, chip, user]);
  const mine = programs.filter((x) => x.createdBy === user!.name).length;
  const minutes = Math.round(day.exercises.reduce((s, e) => s + e.sets * (1.2 + (parseInt(e.rest) || 60) / 60), 0)) + 8;

  return (
    <>
      <PageHead title="Workouts" sub="Programs your trainers build and assign to members" right={edit && <>
        <Btn icon="copy" onClick={() => select(duplicateProgram(p.id).id)}>Duplicate program</Btn>
        <Btn icon="users" onClick={() => setModal('assign')}>Assign to member</Btn>
        <Btn v="primary" icon="plus" onClick={() => setModal('create')}>Create workout</Btn>
      </>} />
      <div className="grid stack-md" style={{ gridTemplateColumns: '340px minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
        <div className="col" style={{ gap: 12 }}>
          <SearchBox id="prog-search" value={q} onChange={setQ} placeholder="Search programs" width="100%" />
          <div className="row" style={{ gap: 8 }}>
            <Chip label="All" count={programs.length} on={chip === 'All'} onClick={() => setChip('All')} />
            <Chip label="Mine" count={mine} on={chip === 'Mine'} onClick={() => setChip('Mine')} />
            <Chip label="Templates" count={programs.length - mine} on={chip === 'Templates'} onClick={() => setChip('Templates')} />
          </div>
          {list.map((x) => {
            const on = x.id === p.id;
            return (
              <button key={x.id} type="button" onClick={() => select(x.id)} className="col" style={{ gap: 10, padding: '18px 20px', borderRadius: 12, background: on ? 'var(--card2)' : 'var(--card)', border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`, color: 'var(--tx)', textAlign: 'left' }}>
                <div className="row between" style={{ width: '100%' }}><span style={{ fontSize: 15, fontWeight: 800 }}>{x.name}</span><Icon name="chevright" size={16} color={on ? 'var(--accent)' : 'var(--tx3)'} /></div>
                <div className="row" style={{ gap: 12, fontSize: 12, color: 'var(--tx3)' }}><span>{x.level}</span><span>·</span><span>{x.weeks}</span><span>·</span><span>{x.daysPerWeek} days / week</span></div>
                <div className="row" style={{ gap: 8, fontSize: 12, color: 'var(--tx2)' }}><Icon name="users" size={14} color="var(--tx3)" /><span className="num" style={{ fontWeight: 700 }}>{count(assignedCount(x.id))}</span> members assigned</div>
              </button>
            );
          })}
          {!list.length && <Empty>No programs match.</Empty>}
        </div>

        <div className="col" style={{ gap: 16, minWidth: 0 }}>
          <Card>
            <div className="row between" style={{ alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
              <div className="col" style={{ gap: 10 }}>
                <div className="row" style={{ gap: 8 }}><Badge dot={false}>{p.level}</Badge><Badge dot={false}>{p.weeks}</Badge><Badge dot={false}>{p.daysPerWeek} days / week</Badge></div>
                <h2 className="display" style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>{p.name}</h2>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--tx2)', maxWidth: 480 }}>{p.description}</p>
                <span style={{ fontSize: 12, color: 'var(--tx3)' }}>Created by {p.createdBy} · updated {fmtDate(p.updated)}</span>
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 120px)', gap: 10 }}>
                <Tile label="Assigned" value={count(assignedCount(p.id))} sub="members" />
                <Tile label="Completion" value={`${p.completion}%`} sub="avg, last 30 days" />
              </div>
            </div>
          </Card>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(6, p.days.length)}, minmax(0, 1fr))`, gap: 8 }}>
            {p.days.map((d, i) => {
              const on = i === di;
              return (
                <button key={d.name} type="button" aria-pressed={on} onClick={() => setDayIdx(i)} className="col" style={{ textAlign: 'left', padding: 12, borderRadius: 10, border: `1px solid ${on ? 'var(--tx)' : 'var(--line)'}`, background: on ? 'var(--tx)' : 'var(--sunk)', color: on ? 'var(--bg0)' : 'var(--tx)', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', color: on ? '#4D473F' : 'var(--tx3)' }}>{d.name.toUpperCase()}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3 }}>{d.focus}</span>
                  <span style={{ fontSize: 11, color: on ? '#4D473F' : 'var(--tx3)' }}>{d.exercises.length} exercises</span>
                </button>
              );
            })}
          </div>
          <section className="table-card">
            <div className="tc-head">
              <CardHead title={<span className="row" style={{ gap: 8 }}>{day.name} · {day.focus}{edit && <IconBtn sm icon="edit" label="Rename day" onClick={() => setModal('rename')} />}</span>} sub={`${day.exercises.length} exercises · about ${minutes} min · warm-up 8 min`} right={edit && <Btn size="sm" icon="plus" onClick={() => setModal('exercise')}>Add exercise</Btn>} />
            </div>
            <div className="table-scroll">
              <table className="tbl dense">
                <thead><tr><th style={{ width: 32 }}>#</th><th>Exercise</th><th>Sets</th><th>Reps</th><th>Rest</th><th>Video</th><th className="r" /></tr></thead>
                <tbody>
                  {day.exercises.map((e, i) => (
                    <tr key={e.name + i}>
                      <td><span className="num muted" style={{ fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</span></td>
                      <td><div className="row" style={{ gap: 12 }}><span style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--card2)', border: '1px solid var(--line2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx3)' }}><Icon name="dumbbell" size={20} /></span><div className="col" style={{ gap: 2 }}><span style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{e.name}</span><span style={{ fontSize: 12, color: 'var(--tx3)' }}>{e.muscle}</span></div></div></td>
                      <td><Num size={14}>{e.sets}</Num></td>
                      <td><Num size={14}>{e.reps}</Num></td>
                      <td>{e.rest}</td>
                      <td>
                        <button type="button" aria-label={`Play ${e.name} demo video`} onClick={() => { setVideo(e); setModal('video'); }} className="row" style={{ gap: 8, height: 32, padding: '0 12px 0 6px', borderRadius: 999, border: '1px solid var(--line2)', background: 'transparent', color: 'var(--tx2)', fontSize: 12, fontWeight: 700 }}>
                          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="play" size={10} color="var(--ink)" stroke={1} /></span>{e.video}
                        </button>
                      </td>
                      <td className="r">{edit && <MoreMenu label={`Edit ${e.name}`} items={[{ label: 'Remove from day', icon: 'x', danger: true, onClick: () => removeExercise(p.id, di, i) }]} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!day.exercises.length && <Empty>No exercises yet. {edit && <button type="button" className="link" onClick={() => setModal('exercise')}>Add the first one</button>}</Empty>}
            </div>
          </section>
          {p.note && (
            <section className="row" style={{ padding: '18px 20px', borderRadius: 12, border: '1px dashed var(--line2)', gap: 14, alignItems: 'flex-start' }}>
              <Icon name="message" size={18} color="var(--tx3)" />
              <div className="col" style={{ gap: 4 }}><span style={{ fontSize: 13, fontWeight: 800 }}>Trainer note</span><span style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--tx2)' }}>{p.note}</span></div>
            </section>
          )}
        </div>
      </div>

      {modal === 'create' && <CreateModal by={user!.name} onClose={() => setModal('')} onCreate={(d) => { select(createProgram(d).id); setModal(''); }} />}
      {modal === 'assign' && <AssignModal program={p} onClose={() => setModal('')} onAssign={(ids) => { assignProgram(ids, p.id); setModal(''); }} />}
      {modal === 'exercise' && <ExerciseModal day={day.name} onClose={() => setModal('')} onAdd={(e) => { addExercise(p.id, di, e); setModal(''); }} />}
      {modal === 'rename' && <RenameModal value={day.focus} onClose={() => setModal('')} onSave={(v) => { saveProgram({ ...p, days: p.days.map((d, i) => (i === di ? { ...d, focus: v } : d)) }); toast(`${day.name} renamed to ${v}`); setModal(''); }} />}
      {modal === 'video' && video && (
        <Modal title={video.name} sub={`${video.muscle} · ${video.sets} × ${video.reps} · rest ${video.rest}`} onClose={() => setModal('')}>
          <div style={{ height: 240, borderRadius: 12, background: 'var(--sunk)', border: '1px solid var(--line)', backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--tx3)' }}>
            <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="play" size={22} color="var(--ink)" stroke={1} /></span>
            <span style={{ fontSize: 13 }}>Demo video · {video.video}</span>
          </div>
          <span className="muted" style={{ fontSize: 13 }}>Club29 records form videos in the gym. Members watch them from the app during the workout.</span>
        </Modal>
      )}
    </>
  );
}

function CreateModal({ by, onClose, onCreate }: { by: string; onClose: () => void; onCreate: (d: { name: string; level: string; weeks: string; days: number; by: string }) => void }) {
  const [f, setF] = useState({ name: '', level: 'Intermediate', weeks: '8 weeks', days: '4' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Create workout program" onClose={onClose} foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" disabled={!f.name.trim()} onClick={() => onCreate({ name: f.name.trim(), level: f.level, weeks: f.weeks, days: Number(f.days), by })}>Create</Btn></>}>
      <Field label="Program name" id="cp-name"><input id="cp-name" className="input lg" value={f.name} onChange={set('name')} placeholder="Summer Shred" /></Field>
      <div className="grid g3">
        <Field label="Level" id="cp-level"><select id="cp-level" className="input lg" value={f.level} onChange={set('level')}><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All levels</option></select></Field>
        <Field label="Length" id="cp-weeks"><select id="cp-weeks" className="input lg" value={f.weeks} onChange={set('weeks')}><option>4 weeks</option><option>8 weeks</option><option>12 weeks</option><option>Ongoing</option></select></Field>
        <Field label="Days / week" id="cp-days"><select id="cp-days" className="input lg" value={f.days} onChange={set('days')}>{[3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select></Field>
      </div>
    </Modal>
  );
}

function AssignModal({ program, onClose, onAssign }: { program: Program; onClose: () => void; onAssign: (ids: string[]) => void }) {
  const { user } = useStore();
  const [picked, setPicked] = useState<Member[]>([]);
  return (
    <Modal title={`Assign ${program.name}`} sub="Members see the program in the Club29 app right away" onClose={onClose}
      foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" disabled={!picked.length} onClick={() => onAssign(picked.map((m) => m.id))}>Assign to {picked.length || ''} member{picked.length === 1 ? '' : 's'}</Btn></>}>
      <MemberPicker value={null} onChange={(m) => m && !picked.some((x) => x.id === m.id) && setPicked([...picked, m])} filter={user!.trainerId ? (m) => m.trainerId === user!.trainerId : undefined} />
      <div className="col" style={{ gap: 8 }}>
        {picked.map((m) => (
          <div key={m.id} className="row" style={{ gap: 12, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--line2)' }}>
            <Avatar name={m.name} size={28} /><span className="grow" style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</span><span className="num muted" style={{ fontSize: 12 }}>{m.id}</span>
            <IconBtn sm icon="x" label={`Remove ${m.name}`} onClick={() => setPicked(picked.filter((x) => x.id !== m.id))} />
          </div>
        ))}
      </div>
    </Modal>
  );
}

function ExerciseModal({ day, onClose, onAdd }: { day: string; onClose: () => void; onAdd: (e: Exercise) => void }) {
  const [f, setF] = useState({ name: '', muscle: '', sets: '3', reps: '12', rest: '60 s' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const ok = f.name.trim() && Number(f.sets) > 0 && f.reps.trim();
  return (
    <Modal title={`Add exercise to ${day}`} onClose={onClose} foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" disabled={!ok} onClick={() => onAdd({ name: f.name.trim(), muscle: f.muscle.trim() || 'General', sets: Number(f.sets), reps: f.reps, rest: f.rest, video: '0:30' })}>Add</Btn></>}>
      <Field label="Exercise" id="ex-name"><input id="ex-name" className="input lg" value={f.name} onChange={set('name')} placeholder="Incline Bench Press" list="ex-lib" /></Field>
      <datalist id="ex-lib">{['Bench Press', 'Back Squat', 'Deadlift', 'Pull-up', 'Lat Pulldown', 'Seated Row', 'Leg Press', 'Lateral Raise', 'Face Pull', 'Plank', 'Hip Thrust', 'Cable Crunch'].map((x) => <option key={x} value={x} />)}</datalist>
      <Field label="Muscle · equipment" id="ex-muscle"><input id="ex-muscle" className="input lg" value={f.muscle} onChange={set('muscle')} placeholder="Chest · Barbell" /></Field>
      <div className="grid g3">
        <Field label="Sets" id="ex-sets"><input id="ex-sets" className="input lg num" inputMode="numeric" value={f.sets} onChange={set('sets')} /></Field>
        <Field label="Reps" id="ex-reps"><input id="ex-reps" className="input lg num" value={f.reps} onChange={set('reps')} /></Field>
        <Field label="Rest" id="ex-rest"><select id="ex-rest" className="input lg" value={f.rest} onChange={set('rest')}>{['30 s', '45 s', '60 s', '75 s', '90 s', '120 s', '180 s'].map((r) => <option key={r}>{r}</option>)}</select></Field>
      </div>
    </Modal>
  );
}

function RenameModal({ value, onClose, onSave }: { value: string; onClose: () => void; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <Modal title="Rename day" onClose={onClose} foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" disabled={!v.trim()} onClick={() => onSave(v.trim())}>Save</Btn></>}>
      <Field label="Focus" id="rn-focus"><input id="rn-focus" className="input lg" value={v} onChange={(e) => setV(e.target.value)} /></Field>
    </Modal>
  );
}
