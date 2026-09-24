import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Btn, Card, CardHead, Field, KV, Modal, MoreMenu, Num, PageHead, Seg, Strong } from '../components/ui';
import type { Offer, Plan } from '../data/types';
import { count, inr } from '../lib/format';
import { canEdit } from '../store/auth';
import { useStore } from '../store/store';

const OTHER = ['couple', 'student'];

export default function Plans() {
  const { plans, offers, members, user, togglePlan, savePlan, addOffer } = useStore();
  const edit = canEdit(user!.role, 'plans');
  const [seg, setSeg] = useState<'Active plans' | 'Disabled' | 'All'>('Active plans');
  const [editing, setEditing] = useState<Plan | 'new' | null>(null);
  const [discount, setDiscount] = useState<string | null>(null);

  const main = plans.filter((p) => p.kind === 'plan' && !OTHER.includes(p.id));
  const cards = main.filter((p) => seg === 'All' || (seg === 'Disabled' ? p.status === 'disabled' : p.status === 'active'));
  const others = plans.filter((p) => p.kind === 'addon' || OTHER.includes(p.id));
  const byPlan = (id: string) => members.filter((m) => m.planId === id).length;
  const annualShare = Math.round((byPlan('annual') / members.length) * 100);

  const planCard = (p: Plan) => {
    const hot = !!p.popular && p.status === 'active';
    const perMonth = p.months ? Math.round(p.price / p.months) : p.price;
    const save = p.months > 1 ? Math.round((1 - perMonth / 2999) * 100) : 0;
    return (
      <section key={p.id} className="card" style={{ background: hot ? 'var(--bg0)' : undefined, borderColor: hot ? 'var(--accent)' : undefined, opacity: p.status === 'disabled' ? 0.6 : 1 }}>
        <div className="row between">
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: hot ? 'var(--accent)' : 'var(--tx2)' }}>{p.name}</span>
          {p.status === 'disabled' ? <Badge>Disabled</Badge> : hot ? <Badge kind="accent" dot={false}>Most popular</Badge> : <Badge kind="ok">Active</Badge>}
        </div>
        <div className="col" style={{ gap: 6 }}>
          <div className="row" style={{ alignItems: 'baseline', gap: 6 }}><span className="num" style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em' }}>{inr(p.price)}</span><span style={{ fontSize: 13, color: 'var(--tx3)' }}>/ {p.durationLabel}</span></div>
          <span style={{ fontSize: 13, color: 'var(--tx3)' }}>{inr(perMonth)} / month{save > 0 && <> · <span style={{ color: 'var(--ok)', fontWeight: 700 }}>Save {save}%</span></>}</span>
        </div>
        <div className="col" style={{ gap: 10, padding: '16px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          <KV k="Duration" v={p.durationLabel} />
          <KV k="Access" v={p.access} />
          <KV k="Personal training" v={p.ptSessions ? `${p.ptSessions} sessions included` : <span style={{ color: 'var(--tx3)', fontWeight: 500 }}>Not included</span>} />
          <KV k="Members" v={<span className="num">{count(byPlan(p.id))}</span>} />
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, gap: 10, flexGrow: 1 }} className="col">
          {p.benefits.map((b) => <li key={b} className="row" style={{ gap: 10, fontSize: 13, color: 'var(--tx2)', lineHeight: 1.4, alignItems: 'flex-start' }}><Icon name="check" size={16} color="var(--accent)" stroke={2.2} />{b}</li>)}
        </ul>
        {edit && (
          <div className="row" style={{ gap: 8 }}>
            <Btn size="sm" icon="edit" onClick={() => setEditing(p)}>Edit plan</Btn>
            <Btn size="sm" v="ghost" icon="tag" onClick={() => setDiscount(p.name)}>Discount</Btn>
            <span className="grow" />
            <MoreMenu label={`More actions for ${p.name}`} items={[
              { label: p.popular ? 'Remove “Most popular”' : 'Mark as most popular', icon: 'star', onClick: () => { plans.filter((x) => x.popular && x.id !== p.id).forEach((x) => savePlan({ ...x, popular: false })); savePlan({ ...p, popular: !p.popular }); } },
              { label: p.status === 'active' ? 'Disable plan' : 'Enable plan', icon: p.status === 'active' ? 'ban' : 'check', danger: p.status === 'active', onClick: () => togglePlan(p.id) },
            ]} />
          </div>
        )}
      </section>
    );
  };

  return (
    <>
      <PageHead title="Memberships" sub="Plans, pricing and offers for Club29" right={edit && <><Btn icon="tag" onClick={() => setDiscount('')}>Create discount</Btn><Btn v="primary" icon="plus" onClick={() => setEditing('new')}>Add plan</Btn></>} />
      <div className="row between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <Seg md items={['Active plans', 'Disabled', 'All'] as const} value={seg} onChange={setSeg} />
        <span style={{ fontSize: 13, color: 'var(--tx3)' }}><span className="num" style={{ color: 'var(--tx)', fontWeight: 700 }}>{count(members.length)}</span> members across {main.filter((p) => p.status === 'active').length} plans · Annual is {annualShare}%</span>
      </div>
      {cards.length ? <div className="grid g4">{cards.map(planCard)}</div> : <Card><span className="muted" style={{ fontSize: 14 }}>No {seg === 'Disabled' ? 'disabled' : ''} plans here. Disabled plans and add-ons are listed below.</span></Card>}
      <div className="grid g2 stack-md" style={{ alignItems: 'start' }}>
        <Card>
          <CardHead title="Offers & discounts" sub="Codes members can use at renewal or joining" right={edit && <Btn size="sm" icon="plus" onClick={() => setDiscount('')}>Create discount</Btn>} />
          <div className="col">
            {offers.map((o) => (
              <div key={o.code} className="list-row" style={{ gap: 16, padding: '14px 0' }}>
                <span className="num" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', padding: '6px 10px', borderRadius: 6, border: '1px dashed var(--line2)' }}>{o.code}</span>
                <div className="col grow" style={{ gap: 2 }}><span style={{ fontSize: 14, fontWeight: 700 }}>{o.description}</span><span style={{ fontSize: 12, color: 'var(--tx3)' }}>{o.window}</span></div>
                <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{o.uses ? `${o.uses} uses` : '—'}</span>
                <Badge kind={o.status === 'Active' ? 'ok' : o.status === 'Scheduled' ? 'info' : 'neutral'}>{o.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <section className="table-card">
          <div className="tc-head"><CardHead title="Other plans & add-ons" sub="Sold alongside the main plans" /></div>
          <table className="tbl dense">
            <thead><tr><th>Name</th><th>Type</th><th className="r">Price</th><th>Status</th><th className="r" /></tr></thead>
            <tbody>
              {others.map((p) => (
                <tr key={p.id}>
                  <td><Strong>{p.name}</Strong></td>
                  <td>{p.kind === 'addon' ? 'Add-on' : `Plan · ${p.durationLabel}`}</td>
                  <td className="r"><Num>{inr(p.price)}</Num></td>
                  <td><Badge kind={p.status === 'active' ? 'ok' : 'neutral'}>{p.status === 'active' ? 'Active' : 'Disabled'}</Badge></td>
                  <td className="r">{edit && <Btn size="sm" v="ghost" onClick={() => togglePlan(p.id)}>{p.status === 'active' ? 'Disable' : 'Enable'}</Btn>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      {editing && <PlanModal plan={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={(p) => { savePlan(p); setEditing(null); }} />}
      {discount !== null && <DiscountModal forPlan={discount} onClose={() => setDiscount(null)} onSave={(o) => { addOffer(o); setDiscount(null); }} />}
    </>
  );
}

function PlanModal({ plan, onClose, onSave }: { plan: Plan | null; onClose: () => void; onSave: (p: Plan) => void }) {
  const [f, setF] = useState({ name: plan?.name ?? '', price: String(plan?.price ?? ''), months: String(plan?.months ?? 1), access: plan?.access ?? 'Standard · 6 AM–10 PM', pt: String(plan?.ptSessions ?? 0), benefits: plan?.benefits.join('\n') ?? '' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const price = Number(f.price), months = Number(f.months);
  const ok = f.name.trim() && price > 0 && months > 0;
  const save = () => onSave({
    id: plan?.id ?? `plan-${Date.now()}`, kind: 'plan', status: plan?.status ?? 'active', popular: plan?.popular,
    name: f.name.trim(), price, months, durationLabel: `${months} month${months > 1 ? 's' : ''}`, access: f.access, ptSessions: Number(f.pt) || 0,
    benefits: f.benefits.split('\n').map((b) => b.trim()).filter(Boolean),
  });
  return (
    <Modal wide title={plan ? `Edit ${plan.name}` : 'Add plan'} sub={plan ? 'Changes apply to new joins and renewals' : 'New plans appear in joining and renewal'} onClose={onClose}
      foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" disabled={!ok} onClick={save}>{plan ? 'Save plan' : 'Add plan'}</Btn></>}>
      <div className="grid g2">
        <Field label="Plan name" id="pl-name"><input id="pl-name" className="input lg" value={f.name} onChange={set('name')} placeholder="Weekend Warrior" /></Field>
        <Field label="Price (₹)" id="pl-price"><input id="pl-price" className="input lg num" inputMode="numeric" value={f.price} onChange={set('price')} /></Field>
        <Field label="Duration (months)" id="pl-months"><select id="pl-months" className="input lg" value={f.months} onChange={set('months')}>{[1, 2, 3, 6, 12].map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
        <Field label="PT sessions included" id="pl-pt"><input id="pl-pt" className="input lg num" inputMode="numeric" value={f.pt} onChange={set('pt')} /></Field>
      </div>
      <Field label="Access" id="pl-access"><select id="pl-access" className="input lg" value={f.access} onChange={set('access')}><option>Standard · 6 AM–10 PM</option><option>All hours · 5 AM–11 PM</option><option>Off-peak · 10 AM–5 PM</option></select></Field>
      <Field label="Benefits (one per line)" id="pl-ben"><textarea id="pl-ben" className="input" rows={4} style={{ height: 'auto', padding: 12 }} value={f.benefits} onChange={set('benefits')} /></Field>
      {price > 0 && months > 0 && <span className="muted" style={{ fontSize: 13 }}>Works out to {inr(price / months)} / month.</span>}
    </Modal>
  );
}

function DiscountModal({ forPlan, onClose, onSave }: { forPlan: string; onClose: () => void; onSave: (o: Offer) => void }) {
  const [code, setCode] = useState(forPlan ? `${forPlan.replace(/\W/g, '').toUpperCase().slice(0, 8)}10` : '');
  const [kind, setKind] = useState<'%' | '₹'>('%');
  const [value, setValue] = useState('10');
  const [window, setWindow] = useState('1–15 Oct 2026');
  const [start, setStart] = useState<'now' | 'later'>('now');
  const v = Number(value);
  const ok = /^[A-Z0-9]{4,12}$/.test(code) && v > 0 && (kind === '₹' || v < 100);
  return (
    <Modal title="Create discount" sub="Members enter the code at renewal or joining" onClose={onClose}
      foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" disabled={!ok} onClick={() => onSave({ code, description: `${kind === '%' ? `${v}%` : inr(v)} off ${forPlan || 'any plan'}`, window, status: start === 'now' ? 'Active' : 'Scheduled', uses: 0 })}>Create code</Btn></>}>
      <Field label="Code" id="dc-code" error={code && !/^[A-Z0-9]{4,12}$/.test(code) ? '4–12 letters or numbers' : undefined}><input id="dc-code" className="input lg num" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="DIWALI20" /></Field>
      <div className="grid g2">
        <Field label="Discount" id="dc-val"><input id="dc-val" className="input lg num" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} /></Field>
        <Field label="Type" id="dc-kind"><Seg md items={['%', '₹'] as const} value={kind} onChange={setKind} /></Field>
      </div>
      <Field label="Valid" id="dc-window"><input id="dc-window" className="input lg" value={window} onChange={(e) => setWindow(e.target.value)} /></Field>
      <Field label="Starts" id="dc-start"><Seg md items={['now', 'later'] as const} value={start} onChange={setStart} /></Field>
    </Modal>
  );
}
