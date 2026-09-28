import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { CheckCircle2, Landmark } from "lucide-react";
import { useFinePointer } from "../hooks/useFinePointer";

const done = ["Application submitted", "Requirements verified", "Planning review completed"];
/** Floating glass cards. Illustrative sample only; they lean toward the cursor on desktop. */
export function HeroPreviewCards() {
  const fine = useFinePointer(), reduce = useReducedMotion(), live = fine && !reduce;
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 }), sy = useSpring(my, { stiffness: 60, damping: 18 });
  const aX = useTransform(sx, (v) => v * -14), aY = useTransform(sy, (v) => v * -10);
  const bX = useTransform(sx, (v) => v * 22), bY = useTransform(sy, (v) => v * 16);
  return (
    <div className="relative hidden h-[26rem] lg:block" role="img" aria-label="Sample application preview: three stages complete, next action is drainage clearance"
      onPointerMove={live ? (e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); } : undefined}
      onPointerLeave={live ? () => { mx.set(0); my.set(0); } : undefined}>
      <motion.div style={live ? { x: aX, y: aY } : undefined} initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }} className="absolute right-0 top-2 w-[21rem]">
        <div className="glass-dark animate-drift rounded-2xl p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/75">Sample application</p>
          <p className="mt-1 font-display text-xl">Proposed Mixed-Use Development</p>
          <ul className="mt-4 space-y-2.5 text-sm">{done.map((l) => <li key={l} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-lagos-100" aria-hidden />{l}</li>)}</ul>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full w-[43%] rounded-full bg-gold-500" /></div>
          <p className="mt-1.5 text-xs text-white/75">3 of 7 stages</p>
        </div>
      </motion.div>
      <motion.div style={live ? { x: bX, y: bY } : undefined} initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.25, duration: 0.8 }} className="absolute bottom-4 left-4 w-64">
        <div className="glass-light animate-drift rounded-2xl p-4 [animation-delay:-3s]">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-warn"><Landmark className="h-4 w-4" aria-hidden />Next action</p>
          <p className="mt-1 font-semibold text-navy-900">Submit drainage clearance</p>
          <p className="text-sm text-ink-soft">Target response: 7 days</p>
        </div>
      </motion.div>
    </div>);
}
