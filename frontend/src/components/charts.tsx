import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
/** Small dependency-free SVG/CSS charts. Each has a text alternative and never relies on colour alone. */
export function BarChart({ data, label }: { data: { label: string; count: number }[]; label: string }) {
  const reduce = useReducedMotion(), max = Math.max(1, ...data.map((d) => d.count));
  return (
    <figure>
      <div role="img" aria-label={label} className="flex h-44 items-end gap-2 border-b border-surface-line pb-px sm:gap-3">
        {data.map((d, i) => (
          <div key={d.label} className="flex h-full flex-1 flex-col justify-end">
            <span className="mb-1 text-center text-xs font-semibold tabular-nums text-navy-900">{d.count}</span>
            <motion.div className="w-full origin-bottom rounded-t-md bg-lagos-700" style={{ height: `${Math.max(3, (d.count / max) * 100)}%` }} initial={{ scaleY: reduce ? 1 : 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ delay: reduce ? 0 : i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
          </div>))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3" aria-hidden>{data.map((d) => <span key={d.label} className="flex-1 text-center text-[0.65rem] text-ink-faint sm:text-xs">{d.label}</span>)}</div>
      <div className="sr-only"><table><caption>{label}</caption><tbody>{data.map((d) => <tr key={d.label}><th scope="row">{d.label}</th><td>{d.count}</td></tr>)}</tbody></table></div>
    </figure>);
}

export function Donut({ parts, label, centre }: { parts: { label: string; count: number; color: string }[]; label: string; centre: ReactNode }) {
  const reduce = useReducedMotion(), total = parts.reduce((n, p) => n + p.count, 0) || 1, R = 15.9155;
  let acc = 0;
  return (
    <figure className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <motion.svg viewBox="0 0 42 42" role="img" aria-label={label} className="h-full w-full -rotate-90" initial={{ opacity: 0, scale: reduce ? 1 : 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <circle cx="21" cy="21" r={R} fill="none" stroke="#E6ECF3" strokeWidth="5" />
          {parts.filter((p) => p.count > 0).map((p) => { const pct = (p.count / total) * 100, gap = Math.max(0, pct - 0.8), el = <circle key={p.label} cx="21" cy="21" r={R} fill="none" stroke={p.color} strokeWidth="5" strokeDasharray={`${gap} ${100 - gap}`} strokeDashoffset={-acc} />; acc += pct; return el; })}
        </motion.svg>
        <span className="absolute inset-0 grid place-content-center text-center text-lg font-bold leading-tight text-navy-900">{centre}</span>
      </div>
      <ul className="w-full space-y-1.5 text-sm">{parts.map((p) => <li key={p.label} className="flex items-center gap-2"><span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: p.color }} /><span className="flex-1 text-ink-soft">{p.label}</span><span className="font-semibold tabular-nums text-navy-900">{p.count}</span></li>)}</ul>
    </figure>);
}

export function HBars({ rows, label }: { rows: { label: string; count: number }[]; label: string }) {
  const reduce = useReducedMotion(), max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul aria-label={label} className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.label}><div className="mb-1 flex justify-between text-sm"><span className="text-ink-soft">{r.label}</span><span className="font-semibold tabular-nums text-navy-900">{r.count}</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-navy-100"><motion.div className="h-full origin-left rounded-full bg-navy-700" style={{ width: `${(r.count / max) * 100}%` }} initial={{ scaleX: reduce ? 1 : 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ delay: reduce ? 0 : i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} /></div></li>))}
    </ul>);
}
