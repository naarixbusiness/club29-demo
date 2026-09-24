import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Badge, Brand, LogoImg } from '../components/ui';
import { count, inrShort } from '../lib/format';
import { DEMO_PASSWORD, HOME, ROLE_LABEL, STAFF } from '../store/auth';
import { isToday, paidThisMonth } from '../store/selectors';
import { useStore } from '../store/store';

export default function Login() {
  const { login, toast, members, checkIns, invoices } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@club29.in');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!login(email, password)) return setError('Email or password is incorrect. Use one of the demo accounts below.');
    const u = STAFF.find((s) => s.email === email.trim().toLowerCase())!;
    nav(HOME[u.role]);
  };

  return (
    <div className="row" style={{ minHeight: '100vh', alignItems: 'stretch' }}>
      <div className="col between" style={{ width: 620, maxWidth: '100%', flexShrink: 0, padding: '48px 80px' }}>
        <Brand px={56} size={22} />
        <form onSubmit={submit} className="col" style={{ gap: 24, width: 400, maxWidth: '100%', padding: '40px 0' }}>
          <div className="col" style={{ gap: 10 }}>
            <h1 className="display" style={{ margin: 0, fontSize: 40, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.1 }}>Welcome back</h1>
            <p style={{ margin: 0, fontSize: 16, color: 'var(--tx3)' }}>Sign in to run Club29: members, payments and more.</p>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className={`input lg${error ? ' err' : ''}`} value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} autoComplete="username" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="row" style={{ position: 'relative' }}>
              <input id="password" type={show ? 'text' : 'password'} className={`input lg${error ? ' err' : ''}`} style={{ paddingRight: 48 }} value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} autoComplete="current-password" />
              <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} style={{ position: 'absolute', right: 6, width: 40, height: 40, border: 'none', background: 'none', color: 'var(--tx3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="eye" size={18} /></button>
            </div>
            {error && <span className="err-msg">{error}</span>}
          </div>
          <div className="row between">
            <label htmlFor="remember" className="row" style={{ gap: 10, fontSize: 14, color: 'var(--tx2)', fontWeight: 600 }}><input id="remember" type="checkbox" className="check" defaultChecked />Remember me</label>
            <button type="button" className="link" style={{ fontSize: 14 }} onClick={() => toast(`Reset link sent to ${email || 'your email'}`, 'info')}>Forgot password?</button>
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ fontSize: 15 }}>Log in<Icon name="arrowright" size={18} /></button>
          <div className="row" style={{ gap: 12, fontSize: 12, color: 'var(--tx3)' }}><span className="grow divider" />or<span className="grow divider" /></div>
          <button type="button" className="btn btn-lg btn-block" onClick={() => toast('OTP sent to +91 98250 ••••• (demo)', 'info')}><Icon name="phone" size={17} />Log in with mobile OTP</button>
          <div className="col" style={{ gap: 8, padding: 16, borderRadius: 12, border: '1px dashed var(--line2)' }}>
            <span className="eyebrow">Demo accounts · password {DEMO_PASSWORD}</span>
            {STAFF.map((s) => (
              <button key={s.email} type="button" onClick={() => { setEmail(s.email); setPassword(DEMO_PASSWORD); setError(''); }} className="row between" style={{ gap: 12, background: 'none', border: 'none', padding: '4px 0', color: email === s.email ? 'var(--accent)' : 'var(--tx2)', fontSize: 13, fontWeight: 600, textAlign: 'left' }}>
                <span>{ROLE_LABEL[s.role]}</span><span className="num" style={{ fontSize: 12 }}>{s.email}</span>
              </button>
            ))}
          </div>
        </form>
        <div className="row" style={{ gap: 20, fontSize: 12, color: 'var(--tx3)' }}><span>© 2026 Club29</span><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Support</a></div>
      </div>
      <div className="grow" style={{ margin: '16px 16px 16px 0', borderRadius: 20, background: 'var(--bg0)', border: '1px solid #221F1B', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 48, minWidth: 0 }}>
        <div aria-hidden="true" className="outline29" style={{ right: -60, bottom: -140, fontSize: 620, WebkitTextStroke: '2px rgba(245,160,30,0.35)', letterSpacing: '-0.04em' }}>29</div>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 14px)' }} />
        <div className="row between" style={{ position: 'relative', alignItems: 'flex-start' }}>
          <LogoImg px={150} radius={24} />
          <div className="row" style={{ gap: 8 }}><Badge kind="accent" dot={false}>Gym OS</Badge><Badge dot={false}>Member app</Badge></div>
        </div>
        <div className="col" style={{ position: 'relative', gap: 28, maxWidth: 520 }}>
          <p className="display" style={{ margin: 0, fontSize: 44, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.015em' }}>Manage the gym.<br />Grow memberships.<br /><span style={{ color: 'var(--accent)' }}>Keep members moving.</span></p>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            {[[count(members.filter((m) => m.expiry >= new Date(2026, 8, 24)).length), 'active members'], [String(checkIns.filter((c) => isToday(c.in)).length), 'check-ins today'], [inrShort(paidThisMonth(invoices)), 'this month']].map(([v, l]) => (
              <div key={l} className="col" style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(27,26,23,0.85)', border: '1px solid var(--line)', gap: 4 }}>
                <span className="num" style={{ fontSize: 22, fontWeight: 700 }}>{v}</span><span style={{ fontSize: 12, color: 'var(--tx3)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
