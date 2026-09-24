import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Btn, Card, CardHead, Delta, Field, IconBtn, Kpi, Modal, MoreMenu, PageHead, Person, Progress, SearchBox, SelectBox, Tabs } from '../components/ui';
import type { Lead, LeadSource, LeadStage } from '../data/types';
import { inr } from '../lib/format';
import { useStore } from '../store/store';

const STAGES: LeadStage[] = ['New Lead', 'Contacted', 'Trial Booked', 'Visited', 'Interested', 'Converted', 'Lost'];
const SOURCES: LeadSource[] = ['Instagram', 'WhatsApp', 'Walk-in', 'Website', 'Referral'];
const SRC_ICON: Record<LeadSource, string> = { Instagram: 'insta', WhatsApp: 'message', Website: 'globe', 'Walk-in': 'door', Referral: 'gift' };
const PLAN_PRICE: Record<string, number> = { Monthly: 2999, Quarterly: 7499, 'Half Yearly': 12999, Annual: 19999, 'Annual + PT': 29999, 'PT · 12 sessions': 9999 };
const VIEWS = ['Pipeline', 'List', 'Follow-ups today', 'Referrals'] as const;
type View = (typeof VIEWS)[number];

export default function Leads() {
  const { leads, moveLead, logContact, addLead } = useStore();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [src, setSrc] = useState('all');
  const [view, setView] = useState<View>('Pipeline');
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<LeadStage | null>(null);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<Set<LeadStage>>(new Set());

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return leads.filter((l) => (src === 'all' || l.source === src) && (!s || l.name.toLowerCase().includes(s) || l.phone.replace(/\s/g, '').includes(s.replace(/\s/g, '')))
      && (view !== 'Follow-ups today' || l.followKind === 'today' || l.followKind === 'late') && (view !== 'Referrals' || l.source === 'Referral'));
  }, [leads, q, src, view]);

  const total = leads.length;
  const trials = leads.filter((l) => ['Trial Booked', 'Visited', 'Interested', 'Converted'].includes(l.stage)).length;
  const converted = leads.filter((l) => l.stage === 'Converted');
  const convRev = converted.reduce((s, l) => s + (PLAN_PRICE[l.plan] ?? 2999), 0);
  const rate = ((converted.length / total) * 100).toFixed(1);
  const followToday = leads.filter((l) => l.followKind === 'today' || l.followKind === 'late').length;
  const bySource = SOURCES.map((s) => { const all = leads.filter((l) => l.source === s); return [s, all.length, all.length ? Math.round((all.filter((l) => l.stage === 'Converted').length / all.length) * 100) : 0] as const; });
  const maxSrc = Math.max(...bySource.map((x) => x[1]));
  const reached = (st: LeadStage) => leads.filter((l) => STAGES.indexOf(l.stage) >= STAGES.indexOf(st) && l.stage !== 'Lost').length;
  const funnel: [string, number][] = [['Leads', total], ['Contacted', reached('Contacted')], ['Trial booked', reached('Trial Booked')], ['Visited', reached('Visited')], ['Converted', converted.length]];

  const card = (l: Lead) => (
    <article key={l.id} className="lead-card" draggable onDragStart={(e) => { setDrag(l.id); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => { setDrag(null); setOver(null); }} style={{ opacity: drag === l.id ? 0.4 : 1 }}>
      <div className="row between" style={{ gap: 8, alignItems: 'flex-start' }}>
        <Person name={l.name} sub={<span className="num">{l.phone}</span>} size={32} />
        <MoreMenu label={`More for ${l.name}`} items={[{ heading: 'Move to' }, ...STAGES.filter((s) => s !== l.stage).map((s) => ({ label: s, icon: s === 'Converted' ? 'check' : s === 'Lost' ? 'x' : 'arrowright', onClick: () => moveLead(l.id, s) }))]} />
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <span className="tag"><Icon name={SRC_ICON[l.source]} size={13} />{l.source}</span>
        <span className="tag outline">{l.plan}</span>
      </div>
      <div className="col" style={{ gap: 6, fontSize: 12 }}>
        {l.referredBy && <div className="row between" style={{ gap: 8 }}><span className="muted">Referred by</span><span style={{ color: 'var(--tx2)', fontWeight: 600 }}>{l.referredBy}</span></div>}
        <div className="row between" style={{ gap: 8 }}><span className="muted">Last contact</span><span style={{ color: 'var(--tx2)', fontWeight: 600, textAlign: 'right' }}>{l.lostReason && l.stage === 'Lost' ? `Reason: ${l.lostReason}` : l.lastContact}</span></div>
        <div className="row between" style={{ gap: 8 }}><span className="muted">Next follow-up</span><span style={{ fontWeight: 800, textAlign: 'right', color: l.followKind === 'today' ? 'var(--accent)' : l.followKind === 'late' ? 'var(--bad)' : l.followKind === 'done' ? 'var(--ok)' : 'var(--tx2)' }}>{l.nextFollowUp}</span></div>
      </div>
      <div className="row" style={{ gap: 6, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
        <IconBtn sm icon="phone" label={`Call ${l.name}`} onClick={() => logContact(l.id, 'Call')} />
        <IconBtn sm icon="message" label={`WhatsApp ${l.name}`} onClick={() => logContact(l.id, 'WhatsApp')} />
        <span className="grow" />
        {l.stage !== 'Converted' && l.stage !== 'Lost' && <Btn size="sm" v="ghost" trail="chevright" onClick={() => moveLead(l.id, STAGES[STAGES.indexOf(l.stage) + 1])}>Next</Btn>}
      </div>
    </article>
  );

  return (
    <>
      <PageHead title="Leads / CRM" sub="Turn enquiries into Club29 members" right={<>
        <SearchBox id="lead-search" value={q} onChange={setQ} placeholder="Search leads" width={260} />
        <SelectBox label="Source" value={src} onChange={setSrc} width={150} options={[['all', 'All sources'], ...SOURCES.map((s) => [s, s] as [string, string])]} />
        <Btn v="primary" icon="plus" onClick={() => setAdding(true)}>Add lead</Btn>
      </>} />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
        <Kpi label="Leads · Sep" value={String(total)} meta={<><Delta>18%</Delta> vs August</>} icon="funnel" />
        <Kpi label="Trials booked" value={String(trials)} meta={`${Math.round((trials / total) * 100)}% of leads`} icon="calendar" />
        <Kpi label="Converted" value={String(converted.length)} meta={`${inr(convRev)} new revenue`} icon="check" />
        <Kpi label="Conversion rate" value={`${rate}%`} meta={`${followToday} follow-ups due today`} icon="target" />
        <Card className="span2">
          <CardHead title="Leads by source" sub="With conversion rate" />
          <div className="col" style={{ gap: 12 }}>
            {bySource.map(([s, n, cr]) => (
              <button key={s} type="button" onClick={() => setSrc(src === s ? 'all' : s)} className="grid" style={{ gridTemplateColumns: '110px minmax(0, 1fr) 36px 70px', alignItems: 'center', gap: 12, fontSize: 13, background: 'none', border: 'none', padding: 0, color: 'inherit', textAlign: 'left', opacity: src === 'all' || src === s ? 1 : 0.45 }}>
                <span className="row" style={{ gap: 8, color: 'var(--tx2)', fontWeight: 700 }}><Icon name={SRC_ICON[s]} size={15} color="var(--tx3)" />{s}</span>
                <Progress h={8} value={(n / maxSrc) * 100} />
                <span className="num" style={{ fontWeight: 700, textAlign: 'right' }}>{n}</span>
                <span style={{ fontSize: 12, color: 'var(--tx3)', textAlign: 'right' }}>{cr}% conv.</span>
              </button>
            ))}
          </div>
        </Card>
        <Card className="span2">
          <CardHead title="Funnel" sub="September" />
          <div className="col" style={{ gap: 8 }}>
            {funnel.map(([s, n], i) => (
              <div key={s} className="row" style={{ gap: 12 }}>
                <span style={{ width: 90, fontSize: 12, color: 'var(--tx2)', fontWeight: 600 }}>{s}</span>
                <div className="grow" style={{ height: 22, borderRadius: 5, background: '#25221E', overflow: 'hidden' }}><div style={{ width: `${(n / total) * 100}%`, height: '100%', background: i === funnel.length - 1 ? 'var(--accent)' : 'var(--gray)', borderRadius: 5 }} /></div>
                <span className="num" style={{ width: 32, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>{n}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="row between" style={{ gap: 16, flexWrap: 'wrap' }}>
        <Tabs items={VIEWS} value={view} onChange={setView} labels={{ 'Follow-ups today': `Follow-ups today · ${followToday}` }} />
        <span style={{ fontSize: 13, color: 'var(--tx3)' }}>Drag a card to move it · avg time to convert <span style={{ color: 'var(--tx)', fontWeight: 700 }}>6.2 days</span></span>
      </div>
      {view === 'List' ? (
        <section className="table-card">
          <div className="table-scroll">
            <table className="tbl">
              <thead><tr><th>Lead</th><th>Source</th><th>Interested in</th><th>Stage</th><th>Last contact</th><th>Next follow-up</th><th className="r" /></tr></thead>
              <tbody>{filtered.map((l) => (
                <tr key={l.id}>
                  <td><Person name={l.name} sub={<span className="num">{l.phone}</span>} size={32} /></td>
                  <td><span className="row" style={{ gap: 8 }}><Icon name={SRC_ICON[l.source]} size={15} color="var(--tx3)" />{l.source}</span></td>
                  <td>{l.plan}</td>
                  <td><SelectBox label={`Stage for ${l.name}`} value={l.stage} onChange={(v) => moveLead(l.id, v as LeadStage)} width={150} options={STAGES.map((s) => [s, s])} /></td>
                  <td>{l.lastContact}</td>
                  <td style={{ color: l.followKind === 'today' ? 'var(--accent)' : l.followKind === 'late' ? 'var(--bad)' : undefined, fontWeight: 700 }}>{l.nextFollowUp}</td>
                  <td className="r"><div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}><IconBtn sm icon="phone" label={`Call ${l.name}`} onClick={() => logContact(l.id, 'Call')} /><IconBtn sm icon="message" label={`WhatsApp ${l.name}`} onClick={() => logContact(l.id, 'WhatsApp')} /></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="board">
          {STAGES.map((s, i) => {
            const items = filtered.filter((l) => l.stage === s);
            const all = expanded.has(s);
            return (
              <div key={s} className={`stage${over === s ? ' drop' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(s); }} onDragLeave={() => setOver(null)} onDrop={(e) => { e.preventDefault(); if (drag) moveLead(drag, s); setDrag(null); setOver(null); }}>
                <div className="row between" style={{ padding: '4px 4px 6px' }}>
                  <span className="row" style={{ gap: 8, fontSize: 13, fontWeight: 800 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: s === 'Converted' ? 'var(--ok)' : s === 'Lost' ? 'var(--bad)' : i === 0 ? 'var(--accent)' : 'var(--tx3)' }} />{s}</span>
                  <span className="num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx3)' }}>{items.length}</span>
                </div>
                {(all ? items : items.slice(0, 3)).map(card)}
                {items.length > 3 && <button type="button" className="link" style={{ alignSelf: 'center', padding: 4 }} onClick={() => { const n = new Set(expanded); if (all) n.delete(s); else n.add(s); setExpanded(n); }}>{all ? 'Show less' : `Show all ${items.length}`}</button>}
                {s === 'New Lead' && <button type="button" onClick={() => setAdding(true)} style={{ height: 36, borderRadius: 8, border: '1px dashed var(--line2)', background: 'transparent', color: 'var(--tx3)', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="plus" size={14} />Add lead</button>}
              </div>
            );
          })}
        </div>
      )}
      {adding && <AddLeadModal onClose={() => setAdding(false)} onSave={(d) => { addLead(d); setAdding(false); }} />}
    </>
  );
}

function AddLeadModal({ onClose, onSave }: { onClose: () => void; onSave: (d: { name: string; phone: string; source: LeadSource; plan: string; nextFollowUp: string; referredBy?: string }) => void }) {
  const [f, setF] = useState({ name: '', phone: '+91 ', source: 'Instagram' as LeadSource, plan: 'Quarterly', follow: 'Today, 6:00 PM', ref: '' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const digits = f.phone.replace(/\D/g, '');
  const ok = f.name.trim() && digits.length === 12;
  return (
    <Modal title="Add lead" sub="Lands in New Lead with a follow-up reminder" onClose={onClose}
      foot={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="primary" disabled={!ok} onClick={() => onSave({ name: f.name.trim(), phone: `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`, source: f.source, plan: f.plan, nextFollowUp: f.follow, referredBy: f.source === 'Referral' ? f.ref : undefined })}>Add lead</Btn></>}>
      <div className="grid g2">
        <Field label="Name" id="ld-name"><input id="ld-name" className="input lg" value={f.name} onChange={set('name')} /></Field>
        <Field label="Mobile" id="ld-phone" error={f.phone.length > 4 && digits.length !== 12 ? '10-digit mobile number' : undefined}><input id="ld-phone" className="input lg num" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Source" id="ld-src"><select id="ld-src" className="input lg" value={f.source} onChange={set('source')}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Interested in" id="ld-plan"><select id="ld-plan" className="input lg" value={f.plan} onChange={set('plan')}>{Object.keys(PLAN_PRICE).map((p) => <option key={p}>{p}</option>)}</select></Field>
      </div>
      {f.source === 'Referral' && <Field label="Referred by (member)" id="ld-ref"><input id="ld-ref" className="input lg" value={f.ref} onChange={set('ref')} placeholder="Rahul Mehta" /></Field>}
      <Field label="Next follow-up" id="ld-follow"><select id="ld-follow" className="input lg" value={f.follow} onChange={set('follow')}><option>Today, 6:00 PM</option><option>Tomorrow, 11 AM</option><option>26 Sep</option><option>28 Sep</option></select></Field>
    </Modal>
  );
}
