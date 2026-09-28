import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
/** Counts up to `to` once visible, and again whenever `to` changes. Shows the final value under reduced motion. */
export function Counter({ to, suffix = "", duration = 1.2 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null), inView = useInView(ref, { once: true, margin: "-10%" }), reduce = useReducedMotion();
  const mv = useMotionValue(0), text = useTransform(mv, (v) => `${Math.round(v)}${suffix}`);
  useEffect(() => { if (reduce) { mv.set(to); return; } if (!inView) return; const c = animate(mv, to, { duration, ease: [0.22, 1, 0.36, 1] }); return () => c.stop(); }, [inView, to, reduce, duration, mv]);
  return <motion.span ref={ref}>{text}</motion.span>;
}
