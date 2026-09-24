import { useMemo, useState } from 'react';
import { MAIN_PLAN_IDS } from '../data/catalog';
import type { Member, Method } from '../data/types';
import { TODAY, addMonths, fmtDate, startOfDay } from '../lib/date';
import { inr } from '../lib/format';
import { memberStatus, openInvoice, planOf } from '../store/selectors';
import { useStore } from '../store/store';
import { Icon } from './Icon';
import { Avatar, Badge, Btn, Field, Modal, SearchBox } from './ui';

const METHODS: Method[] = ['UPI', 'Card', 'Cash', 'Online'];
export const METHOD_ICON: Record<Method, string> = { UPI: 'zap', Card: 'card', Cash: 'wallet', Online: 'globe' };

function MethodPicker({ value, onChange }: { value: Method; onChange: (m: Method) => void }) {
  return (
    <div className="grid g4" style={{ gap: 8 }}>
      {METHODS.map((m) => (
        <button key={m} type="button" aria-pressed={m === value} onClick={() => onChange(m)} className={`option${m === value ? ' on' : ''}`} style={{ flexDirection: 'column', gap: 6, padding: 12, background: m === value ? 'rgba(245,160,30,0.06)' : 'transparent', color: 'var(--tx)', fontSize: 13, fontWeight: 700 }}>
          <Icon name={METHOD_ICON[m]} size={18} color={m === value ? 'var(--accent)' : 'var(--tx3)'} />{m}
        </button>
      ))}
    </div>
  );
}

/** Search-as-you-type member picker used by every modal that needs a member. */
export function MemberPicker({ value, onChange, filter, autoFocusId = 'pick-member' }: { value: Member | null; onChange: (m: Member | null) => void; filter?: (m: Member) => boolean; autoFocusId?: string }) {
  const { members } = useStore();
  const [q, setQ] = useState('');
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return members.filter((m) => (!filter || filter(m)) && (m.name.toLowerCase().includes(s) || m.id.toLowerCase().includes(s) || m.phone.replace(/\s/g, '').includes(s.replace(/\s/g, '')))).slice(0, 6);
  }, [q, members, filter]);
  if (value) {
    return (
      <div className="option on" style={{ cursor: 'default' }}>
        <Avatar name={value.name} size={36} />
        <div className="col grow" style={{ gap: 2 }}><span style={{ fontWeight: 700 }}>{value.name}</span><span className="num" style={{ fontSize: 12, color: 'var(--tx3)' }}>{value.id} · {value.planLabel} · expires {fmtDate(value.expiry)}</span></div>
        <Btn size="sm" v="ghost" onClick={() => onChange(null)}>Change</Btn>
      </div>
    );
  }
  return (
    <div className="col" style={{ gap: 8 }}>
      <SearchBox id={autoFocusId} value={q} onChange={setQ} placeholder="Name, phone or member ID (e.g. C29-1042)" width="100%" />
      {hits.length > 0 && (
        <div className="col" style={{ border: '1px solid var(--line2)', borderRadius: 10, overflow: 'hidden' }}>
          {hits.map((m) => (
            <button key={m.id} type="button" onClick={() => { onChange(m); setQ(''); }} className="row" style={{ gap: 12, padding: '10px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--line)', color: 'var(--tx)', textAlign: 'left' }}>
              <Avatar name={m.name} size={30} />
              <span className="col grow" style={{ gap: 2 }}><span style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</span><span className="num" style={{ fontSize: 12, color: 'var(--tx3)' }}>{m.id} · {m.phone}</span></span>
              <Badge kind={memberStatus(m) === 'Expired' ? 'bad' : memberStatus(m) === 'Expiring' ? 'warn' : 'ok'}>{memberStatus(m)}</Badge>
            </button>
          ))}
        </div>
      )}
      {q.trim() && !hits.length && <span style={{ fontSize: 13, color: 'var(--tx3)' }}>No member matches “{q}”.</span>}
    </div>
  );
}

// ---------- Scan QR / check-in ----------
export function ScanQrModal({ onClose }: { onClose: () => void }) {
  const { members, checkIn, checkIns } = useStore();
  const [picked, setPicked] = useState<Member | null>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const inGym = new Set(checkIns.filter((c) => !c.out).map((c) => c.memberId));
  const simulateScan = () => {
    setScanning(true);
    setError('');
    setTimeout(() => {
      const pool = members.filter((m) => m.expiry >= startOfDay(TODAY) && !inGym.has(m.id) && m.visitsThisMonth > 10);
      setPicked(pool[Math.floor(Math.random() * pool.length)]);
      setScanning(false);
    }, 900);
  };
  const confirm = () => {
    if (!picked) return;
    const r = checkIn(picked.id, scanning ? 'App QR' : 'App QR');
    if (!r.ok) setError(r.msg);
    else onClose();
  };
  return (
    <Modal title="Scan member QR" sub="Member shows the pass in the Club29 app" onClose={onClose}
      foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" icon="check" disabled={!picked} onClick={confirm}>Check in</Btn></>}>
      <button type="button" onClick={simulateScan} style={{ height: 180, borderRadius: 12, border: '1px dashed var(--line2)', background: 'var(--sunk)', color: 'var(--tx2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 14, fontWeight: 700 }}>
        <Icon name={scanning ? 'timer' : 'camera'} size={36} color="var(--accent)" />
        {scanning ? 'Reading QR…' : 'Tap to simulate a camera scan'}
      </button>
      <span className="eyebrow">Or find the member</span>
      <MemberPicker value={picked} onChange={(m) => { setPicked(m); setError(''); }} />
      {picked && memberStatus(picked) === 'Expired' && !error && <span style={{ fontSize: 13, color: 'var(--bad)', fontWeight: 600 }}>Membership expired on {fmtDate(picked.expiry)}. Renew before check-in.</span>}
      {error && <span style={{ fontSize: 13, color: 'var(--bad)', fontWeight: 600 }}>{error}</span>}
    </Modal>
  );
}

// ---------- Record payment ----------
export function RecordPaymentModal({ onClose, member }: { onClose: () => void; member?: Member }) {
  const { recordPayment, invoices } = useStore();
  const [m, setM] = useState<Member | null>(member ?? null);
  const open = m ? openInvoice(m, invoices) : undefined;
  const [item, setItem] = useState(open?.item ?? m?.planLabel ?? '');
  const [amount, setAmount] = useState(open ? String(open.amount) : m ? String(planOf(m.planId)?.price ?? '') : '');
  const [method, setMethod] = useState<Method>('UPI');
  const pick = (x: Member | null) => {
    setM(x);
    if (x) {
      const o = openInvoice(x, invoices);
      setItem(o?.item ?? x.planLabel);
      setAmount(String(o?.amount ?? planOf(x.planId)?.price ?? ''));
    }
  };
  const amt = Number(amount.replace(/[^\d]/g, ''));
  const valid = m && amt > 0 && item.trim();
  return (
    <Modal title="Record payment" sub="Cash, card or UPI received at the desk" onClose={onClose}
      foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" disabled={!valid} onClick={() => { recordPayment({ memberId: m!.id, item, amount: amt, method }); onClose(); }}>Record {amt > 0 ? inr(amt) : 'payment'}</Btn></>}>
      <Field label="Member" id="pick-member"><MemberPicker value={m} onChange={pick} /></Field>
      {open && <div className="tile" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Icon name="receipt" size={16} color="var(--warn)" /><span style={{ fontSize: 13, color: 'var(--tx2)' }}>Open invoice <b className="num" style={{ color: 'var(--tx)' }}>{open.id}</b> · {inr(open.amount)} · {open.status}. Recording this amount closes it.</span></div>}
      <div className="grid g2">
        <Field label="For" id="pay-item"><input id="pay-item" className="input lg" value={item} onChange={(e) => setItem(e.target.value)} /></Field>
        <Field label="Amount (₹)" id="pay-amt" error={amount && !(amt > 0) ? 'Enter an amount above ₹0' : undefined}><input id="pay-amt" className={`input lg num${amount && !(amt > 0) ? ' err' : ''}`} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      </div>
      <Field label="Payment method" id="pay-method"><MethodPicker value={method} onChange={setMethod} /></Field>
    </Modal>
  );
}

// ---------- Renew ----------
export function RenewModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const { renewMember, plans } = useStore();
  const opts = plans.filter((p) => MAIN_PLAN_IDS.includes(p.id) && p.status === 'active');
  const [planId, setPlanId] = useState(member.planId);
  const [method, setMethod] = useState<Method>('UPI');
  const plan = planOf(planId)!;
  const base = member.expiry > startOfDay(TODAY) ? member.expiry : startOfDay(TODAY);
  const newExpiry = addMonths(base, plan.months);
  return (
    <Modal title="Renew membership" sub={`${member.name} · ${member.id}`} onClose={onClose}
      foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" onClick={() => { renewMember(member.id, planId, method); onClose(); }}>Collect {inr(plan.price)}</Btn></>}>
      <div className="col" style={{ gap: 10 }}>
        {opts.map((p) => (
          <label key={p.id} className={`option${p.id === planId ? ' on' : ''}`}>
            <input type="radio" name="renew-plan" className="check" checked={p.id === planId} onChange={() => setPlanId(p.id)} />
            <span className="grow" style={{ fontSize: 14, fontWeight: 700 }}>{p.name}{p.id === member.planId && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: 'var(--tx3)' }}>current</span>}</span>
            <span className="num" style={{ fontSize: 14, fontWeight: 700 }}>{inr(p.price)}</span>
          </label>
        ))}
      </div>
      <div className="row between" style={{ fontSize: 13, color: 'var(--tx3)' }}><span>New expiry</span><span style={{ color: 'var(--tx)', fontWeight: 700 }}>{fmtDate(newExpiry)}</span></div>
      <Field label="Payment method" id="renew-method"><MethodPicker value={method} onChange={setMethod} /></Field>
    </Modal>
  );
}

// ---------- Add member ----------
export function AddMemberModal({ onClose, onCreated }: { onClose: () => void; onCreated?: (m: Member) => void }) {
  const { addMember, trainers, plans } = useStore();
  const opts = plans.filter((p) => MAIN_PLAN_IDS.includes(p.id) && p.status === 'active');
  const [f, setF] = useState({ name: '', phone: '+91 ', email: '', gender: 'Male' as 'Male' | 'Female', dob: '1998-01-01', planId: 'monthly', trainerId: '', emergencyName: '', emergencyPhone: '' });
  const [method, setMethod] = useState<Method>('UPI');
  const [tried, setTried] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const digits = f.phone.replace(/\D/g, '');
  const errs = { name: f.name.trim().split(' ').length < 2 ? 'Enter first and last name' : '', phone: digits.length !== 12 ? 'Enter a 10-digit mobile number' : '' };
  const plan = planOf(f.planId)!;
  const submit = () => {
    setTried(true);
    if (errs.name || errs.phone) return;
    const m = addMember({ ...f, name: f.name.trim(), email: f.email.trim() || `${f.name.trim().toLowerCase().replace(/\s+/g, '.')}@gmail.com`, dob: new Date(f.dob), trainerId: f.trainerId || undefined, method, phone: `+91 ${digits.slice(2, 7)} ${digits.slice(7)}` });
    onClose();
    onCreated?.(m);
  };
  return (
    <Modal wide title="Add member" sub="Creates the member, collects the first payment and sends the app invite" onClose={onClose}
      foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" icon="plus" onClick={submit}>Add member · {inr(plan.price)}</Btn></>}>
      <div className="grid g2">
        <Field label="Full name" id="am-name" error={tried ? errs.name : ''}><input id="am-name" className={`input lg${tried && errs.name ? ' err' : ''}`} value={f.name} onChange={set('name')} placeholder="Rohit Sharma" /></Field>
        <Field label="Mobile" id="am-phone" error={tried ? errs.phone : ''}><input id="am-phone" className={`input lg num${tried && errs.phone ? ' err' : ''}`} value={f.phone} onChange={set('phone')} inputMode="tel" /></Field>
        <Field label="Email" id="am-email"><input id="am-email" type="email" className="input lg" value={f.email} onChange={set('email')} placeholder="name@gmail.com" /></Field>
        <div className="grid g2" style={{ gap: 12 }}>
          <Field label="Gender" id="am-gender"><select id="am-gender" className="input lg" value={f.gender} onChange={set('gender')}><option>Male</option><option>Female</option></select></Field>
          <Field label="Date of birth" id="am-dob"><input id="am-dob" type="date" className="input lg" value={f.dob} onChange={set('dob')} /></Field>
        </div>
        <Field label="Membership plan" id="am-plan"><select id="am-plan" className="input lg" value={f.planId} onChange={set('planId')}>{opts.map((p) => <option key={p.id} value={p.id}>{p.name} · {inr(p.price)}</option>)}</select></Field>
        <Field label="Trainer" id="am-trainer"><select id="am-trainer" className="input lg" value={f.trainerId} onChange={set('trainerId')}><option value="">No trainer</option>{trainers.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.specialization}</option>)}</select></Field>
        <Field label="Emergency contact name" id="am-ename"><input id="am-ename" className="input lg" value={f.emergencyName} onChange={set('emergencyName')} /></Field>
        <Field label="Emergency contact phone" id="am-ephone"><input id="am-ephone" className="input lg num" value={f.emergencyPhone} onChange={set('emergencyPhone')} placeholder="+91" /></Field>
      </div>
      <div className="row between" style={{ fontSize: 13, color: 'var(--tx3)' }}><span>Membership</span><span style={{ color: 'var(--tx)', fontWeight: 700 }}>{fmtDate(startOfDay(TODAY))} → {fmtDate(addMonths(startOfDay(TODAY), plan.months))}</span></div>
      <Field label="First payment" id="am-method"><MethodPicker value={method} onChange={setMethod} /></Field>
    </Modal>
  );
}

// ---------- Generate invoice ----------
export function GenerateInvoiceModal({ onClose }: { onClose: () => void }) {
  const { generateInvoice } = useStore();
  const [m, setM] = useState<Member | null>(null);
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const pick = (x: Member | null) => { setM(x); if (x) { setItem(`${planOf(x.planId)?.name} renewal`); setAmount(String(planOf(x.planId)?.price ?? '')); } };
  const amt = Number(amount.replace(/[^\d]/g, ''));
  return (
    <Modal title="Generate invoice" sub="Sends a UPI payment link on WhatsApp" onClose={onClose}
      foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" icon="send" disabled={!m || !(amt > 0)} onClick={() => { generateInvoice({ memberId: m!.id, item, amount: amt }); onClose(); }}>Create &amp; send</Btn></>}>
      <Field label="Member" id="pick-member"><MemberPicker value={m} onChange={pick} /></Field>
      <div className="grid g2">
        <Field label="For" id="gi-item"><input id="gi-item" className="input lg" value={item} onChange={(e) => setItem(e.target.value)} placeholder="PT · 12 sessions" /></Field>
        <Field label="Amount (₹)" id="gi-amt"><input id="gi-amt" className="input lg num" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
