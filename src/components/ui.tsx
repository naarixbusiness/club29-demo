import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { initials } from '../lib/format';
import { Icon } from './Icon';

type Kind = 'ok' | 'warn' | 'bad' | 'neutral' | 'accent' | 'info';

const TONES = ['#2C2925', '#302A22', '#28282A', '#2E2826', '#292A25'];
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return (
    <span className="avatar" style={{ width: size, height: size, background: TONES[h % TONES.length], fontSize: Math.round(size * 0.36) }}>
      {initials(name)}
    </span>
  );
}

export function Badge({ kind = 'neutral', dot = true, children }: { kind?: Kind; dot?: boolean; children: ReactNode }) {
  return <span className={`badge b-${kind}`}>{dot && <i />}{children}</span>;
}

type BtnProps = {
  children?: ReactNode; v?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; icon?: string; trail?: string;
  onClick?: () => void; disabled?: boolean; block?: boolean; type?: 'button' | 'submit'; style?: CSSProperties; title?: string;
};
export function Btn({ children, v = 'secondary', size = 'md', icon, trail, onClick, disabled, block, type = 'button', style, title }: BtnProps) {
  const cls = ['btn', v !== 'secondary' && `btn-${v}`, size !== 'md' && `btn-${size}`, block && 'btn-block'].filter(Boolean).join(' ');
  const is = size === 'sm' ? 15 : 17;
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} style={style} title={title}>
      {icon && <Icon name={icon} size={is} />}
      {children}
      {trail && <Icon name={trail} size={15} />}
    </button>
  );
}
export function IconBtn({ icon, label, onClick, dot, sm, active }: { icon: string; label: string; onClick?: () => void; dot?: boolean; sm?: boolean; active?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} className={`icon-btn${sm ? ' sm' : ''}`} onClick={onClick} style={active ? { color: 'var(--tx)', borderColor: 'var(--tx2)' } : undefined}>
      <Icon name={icon} size={sm ? 16 : 18} />
      {dot && <span className="dot" />}
    </button>
  );
}

export function Card({ children, style, className = '' }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return <section className={`card ${className}`} style={style}>{children}</section>;
}
export function CardHead({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="row between" style={{ alignItems: 'flex-start', gap: 16 }}>
      <div className="col" style={{ gap: 4, minWidth: 0 }}>
        <h2 className="card-title">{title}</h2>
        {sub && <p className="card-sub">{sub}</p>}
      </div>
      {right && <div className="row" style={{ gap: 8, flexShrink: 0 }}>{right}</div>}
    </div>
  );
}
export function PageHead({ title, sub, right, crumb }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; crumb?: ReactNode }) {
  return (
    <div className="row between" style={{ alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
      <div className="col" style={{ gap: 8 }}>
        {crumb}
        <h1 className="h1">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {right && <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>{right}</div>}
    </div>
  );
}

export function Delta({ children, down, good = true }: { children: ReactNode; down?: boolean; good?: boolean }) {
  const col = good ? 'var(--ok)' : 'var(--bad)';
  return <span className="delta" style={{ color: col }}><Icon name={down ? 'down' : 'up'} size={13} color={col} stroke={2.2} />{children}</span>;
}
export function Kpi({ label, value, meta, icon, onClick }: { label: string; value: ReactNode; meta?: ReactNode; icon: string; onClick?: () => void }) {
  return (
    <section className="kpi" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="row between" style={{ gap: 8 }}>
        <span className="kpi-label">{label}</span>
        <span className="muted" style={{ display: 'inline-flex' }}><Icon name={icon} size={17} /></span>
      </div>
      <div className="kpi-value">{value}</div>
      {meta && <div className="kpi-meta">{meta}</div>}
    </section>
  );
}
export function Tile({ label, value, sub }: { label: ReactNode; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="tile">
      <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{label}</span>
      <span className="num" style={{ fontSize: 20, fontWeight: 700 }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{sub}</span>}
    </div>
  );
}

export function Person({ name, sub, size = 36, onClick }: { name: string; sub?: ReactNode; size?: number; onClick?: () => void }) {
  return (
    <div className="person">
      <Avatar name={name} size={size} />
      <div className="col" style={{ gap: 2 }}>
        {onClick ? <button type="button" className="nm" onClick={(e) => { e.stopPropagation(); onClick(); }}>{name}</button> : <span className="nm">{name}</span>}
        {sub && <span className="sub">{sub}</span>}
      </div>
    </div>
  );
}
export const Num = ({ children, size = 13, color = 'var(--tx)' }: { children: ReactNode; size?: number; color?: string }) => (
  <span className="num" style={{ fontSize: size, fontWeight: 600, color }}>{children}</span>
);
export const Strong = ({ children }: { children: ReactNode }) => <span style={{ color: 'var(--tx)', fontWeight: 600 }}>{children}</span>;

export function Seg<T extends string>({ items, value, onChange, md }: { items: readonly T[] | T[]; value: T; onChange: (v: T) => void; md?: boolean }) {
  return (
    <div role="group" className={`seg${md ? ' md' : ''}`}>
      {items.map((it) => <button key={it} type="button" aria-pressed={it === value} className={it === value ? 'on' : ''} onClick={() => onChange(it)}>{it}</button>)}
    </div>
  );
}
export function Tabs<T extends string>({ items, value, onChange, labels }: { items: readonly T[] | T[]; value: T; onChange: (v: T) => void; labels?: Partial<Record<T, string>> }) {
  return (
    <div role="tablist" className="tabs">
      {items.map((it) => <button key={it} type="button" role="tab" aria-selected={it === value} className={it === value ? 'on' : ''} onClick={() => onChange(it)}>{labels?.[it] ?? it}</button>)}
    </div>
  );
}
export function Chip({ label, count, on, onClick, icon }: { label: string; count?: ReactNode; on?: boolean; onClick?: () => void; icon?: string }) {
  return (
    <button type="button" aria-pressed={!!on} className={`chip${on ? ' on' : ''}`} onClick={onClick}>
      {icon && <Icon name={icon} size={15} />}{label}{count !== undefined && <span className="cnt">{count}</span>}
    </button>
  );
}
export function SelectBox({ value, onChange, options, width = 150, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; width?: number; label: string }) {
  return (
    <span className="select-wrap" style={{ width }}>
      <select aria-label={label} className="input" value={value} onChange={(e) => onChange(e.target.value)} style={{ width }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <Icon name="chevdown" size={15} />
    </span>
  );
}
export function SearchBox({ value, onChange, placeholder, width = 320, id }: { value: string; onChange: (v: string) => void; placeholder: string; width?: number | string; id: string }) {
  return (
    <label htmlFor={id} className="search" style={{ width }}>
      <Icon name="search" size={16} />
      <input id={id} type="search" className="input" placeholder={placeholder} aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
export function Progress({ value, h = 6, color }: { value: number; h?: number; color?: string }) {
  return <div className="progress" style={{ height: h }}><div style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} /></div>;
}
export function Legend({ items }: { items: [string, string, boolean?][] }) {
  return (
    <div className="legend">
      {items.map(([l, c, dash]) => (
        <span key={l}>{dash ? <span style={{ width: 14, height: 0, borderTop: `2px dashed ${c}` }} /> : <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} />}{l}</span>
      ))}
    </div>
  );
}
export const KV = ({ k, v }: { k: ReactNode; v: ReactNode }) => <div className="kv"><span>{k}</span><span>{v}</span></div>;

export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span style={{ fontFamily: 'var(--display)', fontStretch: '118%', fontStyle: 'italic', fontWeight: 800, fontSize: size, letterSpacing: '0.01em', lineHeight: 1 }}>
      CLUB<span style={{ color: 'var(--accent)' }}>29</span>
    </span>
  );
}
export const LogoImg = ({ px = 44, radius = 10 }: { px?: number; radius?: number }) => (
  <img src="/club29-logo.jpg" alt="Club29 Gym logo" width={px} height={px} style={{ display: 'block', borderRadius: radius, flexShrink: 0, objectFit: 'cover' }} />
);
export function Brand({ px = 40, size = 18, sub = 'GYM' }: { px?: number; size?: number; sub?: string }) {
  return (
    <span className="row" style={{ gap: 12 }}>
      <LogoImg px={px} />
      <span className="col hide-sm" style={{ gap: 4 }}>
        <Wordmark size={size} />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--accent)' }}>{sub}</span>
      </span>
    </span>
  );
}

// ---------- dropdown menu ----------
export function useOutside<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, close]);
  return ref;
}
export type MenuItem = { label: string; icon?: string; onClick: () => void; danger?: boolean } | 'sep' | { heading: string };
export function Menu({ trigger, items, left, width }: { trigger: (open: boolean, toggle: () => void) => ReactNode; items: MenuItem[]; left?: boolean; width?: number }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const ref = useOutside<HTMLDivElement>(open, close);
  return (
    <div className="menu-wrap" ref={ref}>
      {trigger(open, () => setOpen((o) => !o))}
      {open && (
        <div role="menu" className={`menu${left ? ' left' : ''}`} style={width ? { minWidth: width } : undefined}>
          {items.map((it, i) =>
            it === 'sep' ? <div key={i} className="sep" /> : 'heading' in it ? <div key={i} className="menu-label">{it.heading}</div> : (
              <button key={i} type="button" role="menuitem" className={it.danger ? 'danger' : ''} onClick={(e) => { e.stopPropagation(); close(); it.onClick(); }}>
                {it.icon && <Icon name={it.icon} size={16} color={it.danger ? 'var(--bad)' : 'var(--tx3)'} />}{it.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
export function MoreMenu({ label, items }: { label: string; items: MenuItem[] }) {
  return <Menu items={items} trigger={(_, t) => <IconBtn sm icon="more" label={label} onClick={t} />} />;
}

// ---------- modal ----------
export function Modal({ title, sub, children, onClose, foot, wide }: { title: string; sub?: ReactNode; children: ReactNode; onClose: () => void; foot?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`modal${wide ? ' wide' : ''}`}>
        <div className="modal-head">
          <div className="col" style={{ gap: 4 }}>
            <h3 className="modal-title">{title}</h3>
            {sub && <span style={{ fontSize: 13, color: 'var(--tx3)' }}>{sub}</span>}
          </div>
          <IconBtn sm icon="x" label="Close" onClick={onClose} />
        </div>
        <div className="modal-body">{children}</div>
        {foot && <div className="modal-foot">{foot}</div>}
      </div>
    </div>
  );
}
export function Field({ label, id, children, error }: { label: string; id: string; children: ReactNode; error?: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <span className="err-msg">{error}</span>}
    </div>
  );
}
export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  const nums = pages <= 5 ? Array.from({ length: pages }, (_, i) => i + 1) : Array.from(new Set([1, Math.max(1, page - 1), page, Math.min(pages, page + 1), pages])).sort((a, b) => a - b);
  return (
    <div className="row" style={{ gap: 6 }}>
      <IconBtn sm icon="chevleft" label="Previous page" onClick={() => onPage(Math.max(1, page - 1))} />
      {nums.map((p, i) => (
        <span key={p} className="row" style={{ gap: 6 }}>
          {i > 0 && p - nums[i - 1] > 1 && <span style={{ padding: '0 2px' }}>…</span>}
          <button type="button" onClick={() => onPage(p)} aria-current={p === page} style={{ minWidth: 32, height: 32, padding: '0 8px', borderRadius: 8, border: `1px solid ${p === page ? 'var(--tx)' : 'var(--line2)'}`, background: p === page ? 'var(--tx)' : 'transparent', color: p === page ? 'var(--bg0)' : 'var(--tx2)', fontSize: 13, fontWeight: 700 }}>{p}</button>
        </span>
      ))}
      <IconBtn sm icon="chevright" label="Next page" onClick={() => onPage(Math.min(pages, page + 1))} />
    </div>
  );
}
export const Empty = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>;
export const Eyebrow = ({ children, color }: { children: ReactNode; color?: string }) => <span className="eyebrow" style={color ? { color } : undefined}>{children}</span>;
