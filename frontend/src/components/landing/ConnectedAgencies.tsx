import { motion, useReducedMotion } from "framer-motion";
import { Counter } from "../Counter";

const agencies = [["LASPPPA / EPPPS", "Physical planning permits"], ["LIRS", "Tax clearance"], ["Drainage Services", "Drainage clearance"], ["LASBCA", "Building control"], ["LSMTL", "Materials testing"]] as const;
const stats = [[7, "connected stages", "from single entry to completion"], [5, "agencies coordinated", "each keeps its own mandate"], [1, "case reference", "for every development"]] as const;
const C = { x: 450, y: 230 }, RX = 330, RY = 170;
const nodes = agencies.map(([n, r], i) => { const a = ((-90 + i * 72) * Math.PI) / 180; return { n, r, x: Math.round(C.x + RX * Math.cos(a)), y: Math.round(C.y + RY * Math.sin(a)) }; });
const path = (n: { x: number; y: number }) => { const mx = (C.x + n.x) / 2, my = (C.y + n.y) / 2, dx = n.x - C.x, dy = n.y - C.y; return `M${C.x} ${C.y} Q${mx - dy * 0.12} ${my + dx * 0.12} ${n.x} ${n.y}`; };

export function StatStrip() {
  return (
    <ul className="-mx-5 flex scroll-pl-5 snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:scroll-pl-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0" aria-label="LASBAG at a glance">
      {stats.map(([n, l, d]) => (
        <li key={l} className="min-w-[16rem] snap-start rounded-2xl border border-surface-line bg-white p-6 md:min-w-0">
          <p className="font-display text-6xl text-lagos-700"><Counter to={n} /></p>
          <p className="mt-1 font-bold text-navy-900">{l}</p><p className="text-sm text-ink-soft">{d}</p>
        </li>))}
    </ul>);
}

/** Text-only nodes (no invented logos). SVG web from md up; a vertical connected list below. */
export default function ConnectedAgencies() {
  const reduce = useReducedMotion();
  return (
    <section aria-labelledby="agencies-h" className="bg-paper">
      <div className="mx-auto max-w-7xl px-5 py-20 md:py-28 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-lagos-700">Connected agencies</p>
        <h2 id="agencies-h" className="mt-3 max-w-2xl font-display text-h1 text-navy-950">One gateway around the agencies Lagos already has.</h2>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">Each agency keeps its legal mandate and existing systems. LASBAG coordinates the journey between them. This prototype uses sample data and does not connect to live agency systems.</p>

        <div className="mt-12 hidden md:block">
          <svg viewBox="0 0 900 460" className="mx-auto w-full max-w-5xl" role="img" aria-label="LASBAG at the centre, connected to LASPPPA, LIRS, Drainage Services, LASBCA and LSMTL">
            {nodes.map((n, i) => (
              <g key={n.n}>
                <motion.path d={path(n)} fill="none" stroke="#138049" strokeWidth={2} strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, margin: "-15%" }} transition={{ duration: 1.1, delay: 0.15 * i, ease: "easeOut" }} />
                {!reduce && <circle r={4} fill="#E0A526"><animateMotion dur={`${3.2 + i * 0.4}s`} begin={`${1.4 + i * 0.3}s`} repeatCount="indefinite" path={path(n)} /></circle>}
              </g>))}
            <circle cx={C.x} cy={C.y} r={62} fill="#071A33" /><circle cx={C.x} cy={C.y} r={72} fill="none" stroke="#E0A526" strokeOpacity={0.5} />
            <text x={C.x} y={C.y - 2} textAnchor="middle" fill="#fff" fontSize={20} fontWeight={800}>LASBAG</text>
            <text x={C.x} y={C.y + 18} textAnchor="middle" fill="#fff" fontSize={11} opacity={0.8}>one case</text>
            {nodes.map((n) => (
              <g key={n.n} transform={`translate(${n.x - 82} ${n.y - 30})`}>
                <rect width={164} height={60} rx={14} fill="#fff" stroke="#DFE5EC" /><text x={82} y={26} textAnchor="middle" fill="#071A33" fontSize={14} fontWeight={700}>{n.n}</text><text x={82} y={44} textAnchor="middle" fill="#4B5A70" fontSize={11}>{n.r}</text>
              </g>))}
          </svg>
        </div>

        <ol className="relative mt-10 space-y-3 before:absolute before:bottom-10 before:left-4 before:top-14 before:w-px before:bg-lagos-600 md:hidden">
          <li className="rounded-2xl bg-navy-950 p-4 text-white"><p className="font-bold">LASBAG</p><p className="text-sm text-white/80">One case, one journey</p></li>
          {agencies.map(([n, r]) => <li key={n} className="relative ml-8 rounded-xl border border-surface-line bg-white p-4 before:absolute before:-left-4 before:top-1/2 before:h-px before:w-4 before:bg-lagos-600"><p className="font-bold text-navy-900">{n}</p><p className="text-sm text-ink-soft">{r}</p></li>)}
        </ol>

        <div className="mt-14"><StatStrip /></div>
      </div>
    </section>);
}
