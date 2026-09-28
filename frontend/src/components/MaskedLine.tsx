import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
/** Headline line that slides up from behind a mask. Falls back to a plain fade under reduced motion. */
export function MaskedLine({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
      <motion.span className={`block ${className}`} initial={reduce ? { opacity: 0 } : { y: "105%" }} animate={reduce ? { opacity: 1 } : { y: "0%" }} transition={{ delay, duration: reduce ? 0.3 : 0.9, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.span>
    </span>);
}
