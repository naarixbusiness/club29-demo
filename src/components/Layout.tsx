import { useMemo, useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { Role } from '../data/types';
import { relTime } from '../lib/date';
import { count, inr } from '../lib/format';
import { HOME, ROLE_LABEL, STAFF, canSee, type Screen } from '../store/auth';
import { useStore } from '../store/store';
import { Icon } from './Icon';
import { ScanQrModal } from './modals';
import { Avatar, Brand, Menu, useOutside } from './ui';

type NavDef = { screen?: Screen; label: string; icon: string; to?: string; count?: () => string | undefined };

function useNav(): [string, NavDef[]][] {
  const { members, invoices, leads, user } = useStore();
  const own = user?.trainerId;
  return [
    ['Manage', [
      { screen: 'dashboard', label: 'Dashboard', icon: 'dashboard', to: '/dashboard' },
      { screen: 'members', label: 'Members', icon: 'users', to: '/members', count: () => count(own ? members.filter((m) => m.trainerId === own).length : members.length) },
      { screen: 'plans', label: 'Memberships', icon: 'card', to: '/memberships' },
      { screen: 'attendance', label: 'Attendance', icon: 'calcheck', to: '/attendance' },
      { screen: 'trainers', label: own ? 'My profile' : 'Trainers', icon: 'trainer', to: '/trainers' },
      { screen: 'payments', label: 'Payments', icon: 'wallet', to: '/payments', count: () => String(invoices.filter((i) => i.status === 'Pending').length) },
    ]],
    ['Grow', [
      { screen: 'leads', label: 'Leads / CRM', icon: 'funnel', to: '/leads', count: () => `${leads.filter((l) => l.stage === 'New Lead').length} new` },
      { screen: 'reports', label: 'Reports', icon: 'chart', to: '/reports' },
    ]],
    ['Engage', [
      { screen: 'workouts', label: 'Workouts', icon: 'dumbbell', to: '/workouts' },
      { label: 'Nutrition', icon: 'apple' },
      { label: 'Notifications', icon: 'bell' },
    ]],
  ];
}

function Sidebar() {
  const { user, toast, members } = useStore();
  const groups = useNav();
  const role = user!.role;
  const appUsers = Math.round(members.length * 0.811);
  const item = (n: NavDef) => {
    const inner = (
      <>
        <Icon name={n.icon} size={18} />
        <span className="grow hide-sm">{n.label}</span>
        {n.count && (() => { const c = n.count(); return c ? <span className={`nav-count hide-sm${c.includes('new') ? ' new' : ''}`}>{c}</span> : null; })()}
      </>
    );
    if (!n.to) return <button key={n.label} type="button" className="nav-item" title={n.label} onClick={() => toast(`${n.label} is outside this 11-screen staff demo`, 'info')}>{inner}</button>;
    return <NavLink key={n.label} to={n.to} title={n.label} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>{inner}</NavLink>;
  };
  return (
    <aside className="sidebar">
      <NavLink to={HOME[role]} aria-label="Club29 home" className="row" style={{ height: 48, padding: '0 8px', marginBottom: 16 }}>
        <Brand px={44} size={19} sub={role === 'owner' ? 'GYM · ADMIN' : `GYM · ${ROLE_LABEL[role].split(' / ')[0].toUpperCase()}`} />
      </NavLink>
      <nav aria-label="Main" className="col" style={{ gap: 2 }}>
        {groups.map(([g, items]) => {
          const visible = items.filter((n) => !n.screen || canSee(role, n.screen));
          if (!visible.some((n) => n.screen)) return null;
          return (
            <div key={g} className="col" style={{ gap: 2 }}>
              <div className="nav-group hide-sm">{g}</div>
              {visible.map(item)}
            </div>
          );
        })}
      </nav>
      <div className="grow" />
      <div className="col" style={{ gap: 2, marginTop: 24 }}>
        {role === 'owner' && (
          <div className="hide-sm" style={{ margin: '0 0 12px', padding: 16, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="row" style={{ gap: 8, fontSize: 13, fontWeight: 700 }}><Icon name="smartphone" size={16} color="var(--accent)" />Member app</div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--tx3)' }}><span className="num" style={{ color: 'var(--tx)', fontWeight: 700 }}>{count(appUsers)}</span> of {count(members.length)} members use the Club29 app</div>
            <div className="progress" style={{ height: 4 }}><div style={{ width: `${Math.round((appUsers / members.length) * 100)}%` }} /></div>
          </div>
        )}
        {item({ label: 'Settings', icon: 'sliders' })}
      </div>
    </aside>
  );
}

function GlobalSearch() {
  const { members, invoices, leads, user } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useOutside<HTMLDivElement>(open, () => setOpen(false));
  const role = user!.role;
  const res = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const out: { icon: string; title: string; sub: string; go: string }[] = [];
    if (canSee(role, 'members') || canSee(role, 'profile')) {
      members.filter((m) => (!user!.trainerId || m.trainerId === user!.trainerId) && (m.name.toLowerCase().includes(s) || m.id.toLowerCase().includes(s) || m.phone.replace(/\s/g, '').includes(s.replace(/\s/g, ''))))
        .slice(0, 5).forEach((m) => out.push({ icon: 'user', title: m.name, sub: `${m.id} · ${m.planLabel}`, go: `/members/${m.id}` }));
    }
    if (canSee(role, 'payments')) invoices.filter((i) => i.id.toLowerCase().includes(s)).slice(0, 3).forEach((i) => out.push({ icon: 'receipt', title: i.id, sub: `${inr(i.amount)} · ${i.status}`, go: `/payments?q=${i.id}` }));
    if (canSee(role, 'leads')) leads.filter((l) => l.name.toLowerCase().includes(s)).slice(0, 3).forEach((l) => out.push({ icon: 'funnel', title: l.name, sub: `Lead · ${l.stage}`, go: `/leads?q=${encodeURIComponent(l.name)}` }));
    return out;
  }, [q, members, invoices, leads, role, user]);
  return (
    <div ref={ref} className="menu-wrap" style={{ width: 380, maxWidth: '40vw' }}>
      <label htmlFor="global-search" className="search" style={{ width: '100%' }}>
        <Icon name="search" size={16} />
        <input id="global-search" type="search" className="input" placeholder="Search members, invoices, leads…" aria-label="Search members, invoices, leads" value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} />
      </label>
      {open && q.trim().length >= 2 && (
        <div className="menu left" style={{ width: '100%' }}>
          {res.length === 0 && <div style={{ padding: 12, fontSize: 13, color: 'var(--tx3)' }}>Nothing matches “{q}”.</div>}
          {res.map((r, i) => (
            <button key={i} type="button" onClick={() => { nav(r.go); setOpen(false); setQ(''); }}>
              <Icon name={r.icon} size={16} color="var(--tx3)" />
              <span className="col" style={{ gap: 2 }}><span style={{ fontWeight: 700 }}>{r.title}</span><span style={{ fontSize: 12, color: 'var(--tx3)' }}>{r.sub}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Topbar() {
  const { user, logout, switchRole, activity, toast } = useStore();
  const nav = useNavigate();
  const [scan, setScan] = useState(false);
  const [seen, setSeen] = useState(0);
  const role = user!.role;
  const unread = Math.max(0, Math.min(5, activity.length - seen));
  return (
    <header className="topbar">
      <GlobalSearch />
      <div className="row" style={{ gap: 12 }}>
        <Menu items={[{ heading: 'Branch' }, { label: 'Main Branch · current', icon: 'check', onClick: () => {} }, { label: 'Add a branch', icon: 'plus', onClick: () => toast('Multi-branch is available on the Club29 Pro plan', 'info') }]}
          trigger={(_, t) => (
            <button type="button" aria-haspopup="menu" onClick={t} className="hide-md row" style={{ gap: 10, height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid var(--line2)', background: 'var(--card)', color: 'var(--tx)', fontSize: 13, fontWeight: 700 }}>
              <Icon name="building" size={16} color="var(--tx3)" />Main Branch<Icon name="chevdown" size={15} color="var(--tx3)" />
            </button>
          )} />
        {canSee(role, 'attendance') && role !== 'trainer' && (
          <button type="button" aria-label="Scan QR" title="Scan QR" className="icon-btn" onClick={() => setScan(true)}><Icon name="qr" size={18} /></button>
        )}
        <Menu width={340} items={[{ heading: 'Notifications' }, ...activity.slice(0, 6).map((a) => ({ label: `${a.who} ${a.what} · ${relTime(a.at)}`, icon: a.icon, onClick: () => { if (a.memberId && (canSee(role, 'profile'))) nav(`/members/${a.memberId}`); } }))]}
          trigger={(_, t) => (
            <button type="button" aria-label={`Notifications, ${unread} unread`} className="icon-btn" onClick={() => { t(); setSeen(activity.length); }}>
              <Icon name="bell" size={18} />{unread > 0 && <span className="dot" />}
            </button>
          )} />
        <div style={{ width: 1, height: 28, background: 'var(--line2)', margin: '0 4px' }} />
        <Menu width={260} items={[
          { heading: 'Switch demo role' },
          ...STAFF.map((s) => ({ label: `${ROLE_LABEL[s.role]}${s.role === role ? ' · current' : ''}`, icon: s.role === role ? 'check' : 'user', onClick: () => { switchRole(s.role as Role); nav(HOME[s.role]); toast(`Now viewing as ${s.name} · ${ROLE_LABEL[s.role]}`, 'info'); } })),
          'sep',
          { label: 'Log out', icon: 'logout', danger: true, onClick: () => { logout(); nav('/login'); } },
        ]}
          trigger={(_, t) => (
            <button type="button" aria-haspopup="menu" aria-label="Profile menu" onClick={t} className="row" style={{ gap: 10, height: 44, padding: '0 6px 0 0', background: 'none', border: 'none', color: 'var(--tx)' }}>
              <Avatar name={user!.name === 'Admin' ? 'Club Admin' : user!.name} size={36} />
              <span className="col hide-md" style={{ alignItems: 'flex-start', gap: 1 }}><span style={{ fontSize: 13, fontWeight: 700 }}>{user!.name}</span><span style={{ fontSize: 11, color: 'var(--tx3)' }}>{user!.title}</span></span>
              <Icon name="chevdown" size={15} color="var(--tx3)" />
            </button>
          )} />
      </div>
      {scan && <ScanQrModal onClose={() => setScan(false)} />}
    </header>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <Icon name={t.kind === 'bad' ? 'x' : t.kind === 'info' ? 'bell' : 'check'} size={18} color={t.kind === 'bad' ? 'var(--bad)' : t.kind === 'info' ? 'var(--info)' : 'var(--ok)'} stroke={2.2} />
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <div className="main-col">
        <Topbar />
        <main className="page">{children}</main>
      </div>
    </div>
  );
}

export function NoAccess({ screen }: { screen: string }) {
  const { user } = useStore();
  return (
    <div className="card" style={{ alignItems: 'center', textAlign: 'center', padding: 64, gap: 12 }}>
      <Icon name="lock" size={32} color="var(--tx3)" />
      <h2 className="card-title">No access to {screen}</h2>
      <p className="card-sub">{ROLE_LABEL[user!.role]} accounts can’t open this screen. Switch role from the profile menu to see it.</p>
    </div>
  );
}
