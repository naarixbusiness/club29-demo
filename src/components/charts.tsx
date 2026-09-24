// SVG charts from the Club29 design, sized to their container. Every mark has a hover tooltip.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

const C = { line: '#2B2925', tx: '#F5F2EB', tx3: '#8F8980', accent: '#F5A01E', gray: '#6F6A62', card: '#1B1A17', track: '#2C2925' };
const r1 = (n: number) => Math.round(n * 10) / 10;

function useWidth(fallback = 600) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(fallback);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(160, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function barPath(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0) return '';
  r = Math.min(r, h, w / 2);
  return `M${r1(x)} ${r1(y + h)}V${r1(y + r)}Q${r1(x)} ${r1(y)} ${r1(x + r)} ${r1(y)}H${r1(x + w - r)}Q${r1(x + w)} ${r1(y)} ${r1(x + w)} ${r1(y + r)}V${r1(y + h)}Z`;
}

type Grid = { w: number; h: number; pl: number; pr: number; pt: number; pb: number; max: number; min?: number; ticks: number[]; fmt: (v: number) => string };
function GridLines({ w, h, pl, pr, pt, pb, max, min = 0, ticks, fmt }: Grid) {
  const ih = h - pt - pb;
  return (
    <>
      {ticks.map((t) => {
        const y = pt + ih - ((t - min) / (max - min)) * ih;
        return (
          <g key={t}>
            <line x1={pl} x2={w - pr} y1={r1(y)} y2={r1(y)} stroke={C.line} strokeWidth={1} strokeDasharray={t === min ? undefined : '2 4'} />
            <text x={pl - 10} y={r1(y + 4)} textAnchor="end" fontSize={11} fill={C.tx3}>{fmt(t)}</text>
          </g>
        );
      })}
    </>
  );
}

function Tip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, calc(-100% - 10px))', pointerEvents: 'none', padding: '8px 10px', borderRadius: 8, background: '#2C2925', border: '1px solid #3A3631', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', fontSize: 12, fontWeight: 600, color: C.tx, whiteSpace: 'nowrap', zIndex: 5 }}>
      {children}
    </div>
  );
}

export function Bars({ values, labels, max, ticks, fmt = String, tip, hi = [], h = 220, pl = 44, pr = 4, pt = 8, pb = 28, bw, labelEvery = 1, valueLabels, color = C.accent, onBar }: {
  values: number[]; labels: string[]; max: number; ticks: number[]; fmt?: (v: number) => string; tip?: (l: string, v: number) => string; hi?: number[]; h?: number;
  pl?: number; pr?: number; pt?: number; pb?: number; bw?: number; labelEvery?: number; valueLabels?: boolean; color?: string; onBar?: (i: number) => void;
}) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const iw = w - pl - pr, ih = h - pt - pb, n = values.length, slot = iw / n;
  const bwid = Math.min(bw ?? 32, slot * 0.62);
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <svg width={w} height={h} role="img" style={{ display: 'block', overflow: 'visible', fontFamily: 'Manrope, sans-serif' }}>
        <GridLines w={w} h={h} pl={pl} pr={pr} pt={pt} pb={pb} max={max} ticks={ticks} fmt={fmt} />
        {values.map((v, i) => {
          const bh = (Math.min(v, max) / max) * ih, x = pl + slot * i + (slot - bwid) / 2, y = pt + ih - bh;
          const isHi = hi.includes(i);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => onBar?.(i)} style={{ cursor: onBar ? 'pointer' : 'default' }}>
              <rect x={pl + slot * i} y={pt} width={slot} height={ih} fill={hover === i ? 'rgba(255,255,255,0.03)' : 'transparent'} />
              <path d={barPath(x, y, bwid, bh)} fill={isHi ? color : C.gray} opacity={hover !== null && hover !== i ? 0.7 : 1} />
              {valueLabels && isHi && <text x={x + bwid / 2} y={y - 8} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.tx}>{fmt(v)}</text>}
              {i % labelEvery === 0 && <text x={pl + slot * i + slot / 2} y={h - 8} textAnchor="middle" fontSize={11} fill={isHi ? C.tx : C.tx3}>{labels[i]}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && <Tip x={pl + slot * hover + slot / 2} y={pt + ih - (Math.min(values[hover], max) / max) * ih}>{tip ? tip(labels[hover], values[hover]) : `${labels[hover]}: ${fmt(values[hover])}`}</Tip>}
    </div>
  );
}

export function Grouped({ series, labels, max, ticks, fmt = String, h = 240, pl = 44, pr = 4, pt = 8, pb = 28, bw = 12, gap = 3 }: {
  series: { name: string; color: string; values: (number | null)[] }[]; labels: string[]; max: number; ticks: number[]; fmt?: (v: number) => string; h?: number; pl?: number; pr?: number; pt?: number; pb?: number; bw?: number; gap?: number;
}) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const iw = w - pl - pr, ih = h - pt - pb, n = labels.length, slot = iw / n, k = series.length;
  const bwid = Math.min(bw, (slot * 0.8 - (k - 1) * gap) / k);
  const gw = k * bwid + (k - 1) * gap;
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <svg width={w} height={h} role="img" style={{ display: 'block', overflow: 'visible', fontFamily: 'Manrope, sans-serif' }}>
        <GridLines w={w} h={h} pl={pl} pr={pr} pt={pt} pb={pb} max={max} ticks={ticks} fmt={fmt} />
        {labels.map((l, i) => {
          const x0 = pl + slot * i + (slot - gw) / 2;
          return (
            <g key={l + i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pl + slot * i} y={pt} width={slot} height={ih} fill={hover === i ? 'rgba(255,255,255,0.03)' : 'transparent'} />
              {series.map((s, j) => {
                const v = s.values[i] ?? 0;
                const bh = (v / max) * ih;
                return <path key={j} d={barPath(x0 + j * (bwid + gap), pt + ih - bh, bwid, bh, 3)} fill={s.color} />;
              })}
              <text x={pl + slot * i + slot / 2} y={h - 8} textAnchor="middle" fontSize={11} fill={C.tx3}>{l}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <Tip x={pl + slot * hover + slot / 2} y={pt + ih - (Math.max(...series.map((s) => s.values[hover] ?? 0)) / max) * ih}>
          {labels[hover]} · {series.map((s) => `${s.name} ${s.values[hover] == null ? '–' : fmt(s.values[hover]!)}`).join(' · ')}
        </Tip>
      )}
    </div>
  );
}

export function Line({ series, labels, min = 0, max, ticks, fmt = String, h = 200, pl = 44, pr = 12, pt = 16, pb = 28, labelEvery = 1, endLabel = true }: {
  series: { name: string; color: string; values: (number | null)[]; dash?: boolean; area?: boolean }[]; labels: string[]; min?: number; max: number; ticks: number[];
  fmt?: (v: number) => string; h?: number; pl?: number; pr?: number; pt?: number; pb?: number; labelEvery?: number; endLabel?: boolean;
}) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const iw = w - pl - pr, ih = h - pt - pb, n = labels.length;
  const X = (i: number) => pl + (n === 1 ? 0 : (iw * i) / (n - 1));
  const Y = (v: number) => pt + ih - ((v - min) / (max - min)) * ih;
  const sw = iw / Math.max(1, n - 1);
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <svg width={w} height={h} role="img" style={{ display: 'block', overflow: 'visible', fontFamily: 'Manrope, sans-serif' }}>
        <GridLines w={w} h={h} pl={pl} pr={pr} pt={pt} pb={pb} max={max} min={min} ticks={ticks} fmt={fmt} />
        {labels.map((l, i) => (i % labelEvery === 0 || i === n - 1) && (
          <text key={i} x={X(i)} y={h - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize={11} fill={C.tx3}>{l}</text>
        ))}
        {hover !== null && <line x1={X(hover)} x2={X(hover)} y1={pt} y2={pt + ih} stroke="#4A463F" strokeWidth={1} />}
        {series.map((s) => {
          const pts = s.values.map((v, i) => (v == null ? null : [X(i), Y(v)] as [number, number])).filter((p): p is [number, number] => !!p);
          if (!pts.length) return null;
          const d = pts.map((p, i) => `${i ? 'L' : 'M'}${r1(p[0])} ${r1(p[1])}`).join('');
          const last = pts[pts.length - 1];
          const lastVal = [...s.values].reverse().find((v) => v != null)!;
          return (
            <g key={s.name}>
              {s.area && <path d={`${d}L${r1(last[0])} ${pt + ih}L${r1(pts[0][0])} ${pt + ih}Z`} fill={s.color} fillOpacity={0.08} />}
              <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dash ? '4 4' : undefined} />
              {!s.dash && <circle cx={last[0]} cy={last[1]} r={5} fill={s.color} stroke={C.card} strokeWidth={2} />}
              {!s.dash && endLabel && <text x={last[0] - 10} y={last[1] - 12} textAnchor="end" fontSize={12} fontWeight={700} fill={C.tx}>{fmt(lastVal)}</text>}
              {hover !== null && s.values[hover] != null && !s.dash && <circle cx={X(hover)} cy={Y(s.values[hover]!)} r={4} fill={s.color} stroke={C.card} strokeWidth={2} />}
            </g>
          );
        })}
        {labels.map((_, i) => <rect key={i} x={X(i) - sw / 2} y={pt} width={sw} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />)}
      </svg>
      {hover !== null && (
        <Tip x={X(hover)} y={Y(Math.max(...series.map((s) => s.values[hover] ?? min)))}>
          {labels[hover]} · {series.map((s) => `${s.name} ${s.values[hover] == null ? '–' : fmt(s.values[hover]!)}`).join(' · ')}
        </Tip>
      )}
    </div>
  );
}

export function Ring({ value, size = 120, sw = 12, label, sub, fs = 24, color = C.accent }: { value: number; size?: number; sw?: number; label: ReactNode; sub?: ReactNode; fs?: number; color?: string }) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r, d = (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }} title={`${value}%`}>
      <svg width={size} height={size} role="img" style={{ display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.track} strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${r1(d)} ${r1(c)}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <span className="num" style={{ fontWeight: 700, fontSize: fs, lineHeight: 1 }}>{label}</span>
        {sub && <span style={{ fontSize: 11, color: C.tx3 }}>{sub}</span>}
      </div>
    </div>
  );
}
