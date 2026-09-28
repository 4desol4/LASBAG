import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { HeroScene } from "../components/HeroScene";
import { Logo } from "../components/Logo";
/** Auth pages: the Lekki bridge at night, with the form on a frosted card over it. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative isolate min-h-svh overflow-hidden">
      <HeroScene fade={false} />
      <div className="relative z-10 mx-auto grid min-h-svh max-w-7xl items-center gap-10 px-4 py-8 pt-safe pb-safe lg:grid-cols-[1fr_30rem] lg:px-8">
        <div className="hidden text-white lg:block">
          <Link to="/" aria-label="LASBAG home"><Logo light /></Link>
          <p className="mt-16 max-w-md font-display text-5xl leading-[1.05]">A safer, smarter Lagos <span className="italic text-gold-400">for generations.</span></p>
          <p className="mt-5 max-w-sm text-white/80">One Development. One Journey. Connected Government.</p>
        </div>
        <motion.main id="main" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="glass-sheet mx-auto w-full max-w-md rounded-2xl p-6 sm:p-8">
          <Link to="/" className="mb-6 block lg:hidden" aria-label="LASBAG home"><Logo /></Link>
          <h1 className="font-display text-h1 text-navy-950">{title}</h1><p className="mt-2 text-ink-soft">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </motion.main>
      </div>
    </div>);
}
