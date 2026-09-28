import { clsx } from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { ProgressBar } from "./ui/primitives";
import { Counter } from "./Counter";
type S = { key: string; label: string; state: "COMPLETED" | "IN_PROGRESS" | "PENDING" };
const word = { COMPLETED: "Completed", IN_PROGRESS: "In progress", PENDING: "Pending" };

function Node({ n, state, delay }: { n: number; state: S["state"]; delay: number }) {
  const reduce = useReducedMotion(), d = reduce ? 0 : delay, done = state === "COMPLETED";
  return (
    <span className="relative grid h-11 w-11 shrink-0 place-items-center">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r="19" fill="none" className="stroke-navy-100" strokeWidth="3" />
        <motion.circle cx="22" cy="22" r="19" fill="none" className="stroke-lagos-700" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: reduce ? (done ? 1 : 0) : 0 }} animate={{ pathLength: done ? 1 : state === "IN_PROGRESS" ? 0.35 : 0 }} transition={{ delay: d, duration: 0.7, ease: "easeOut" }} />
      </svg>
      <motion.span className={clsx("absolute inset-[5px] rounded-full", done ? "bg-lagos-700" : state === "IN_PROGRESS" ? "bg-lagos-100" : "bg-white")} initial={false} animate={{ scale: 1 }} />
      {done ? (
        <svg viewBox="0 0 24 24" className="relative h-5 w-5" aria-hidden><motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ delay: d + 0.45, duration: 0.35 }} /></svg>
      ) : <span className={clsx("relative text-sm font-bold", state === "IN_PROGRESS" ? "text-lagos-800" : "text-ink-faint")}>{n}</span>}
    </span>);
}

/** Horizontal from md, vertical timeline below. Ring fills, check draws and connector fills in sequence; only the changed stages re-animate. */
export function JourneyTracker({ stages, progress }: { stages: S[]; progress: number }) {
  const done = stages.filter((s) => s.state === "COMPLETED").length, reduce = useReducedMotion();
  const fill = (i: number, cls: string, from: "x" | "y") => <motion.span aria-hidden className={cls} initial={{ [from === "x" ? "scaleX" : "scaleY"]: reduce ? (stages[i].state === "COMPLETED" ? 1 : 0) : 0 }} animate={{ [from === "x" ? "scaleX" : "scaleY"]: stages[i].state === "COMPLETED" ? 1 : 0 }} transition={{ delay: reduce ? 0 : i * 0.12 + 0.55, duration: 0.45 }} />;
  return (
    <section aria-labelledby="journey-h" className="rounded-xl border border-surface-line bg-white p-5 shadow-card lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h2 id="journey-h" className="text-h3 text-navy-900">Your development approval journey</h2>
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:w-auto sm:flex-nowrap">
          <span className="whitespace-nowrap font-semibold">Journey progress: <Counter to={progress} suffix="%" /></span><div className="order-last w-full sm:order-none sm:w-28"><ProgressBar value={progress} label="Journey progress" /></div><span className="whitespace-nowrap text-ink-soft">{done} of {stages.length} stages</span>
        </div>
      </div>
      <ol className="mt-6 grid gap-0 lg:grid-cols-7 lg:gap-2">
        {stages.map((s, i) => (
          <li key={s.key} aria-current={s.state === "IN_PROGRESS" ? "step" : undefined} className="relative flex gap-4 pb-6 last:pb-0 lg:flex-col lg:items-center lg:gap-2 lg:pb-0 lg:text-center">
            {i < stages.length - 1 && <>
              <span aria-hidden className="absolute left-[21px] top-11 h-[calc(100%-2.75rem)] w-0.5 bg-navy-100 lg:hidden">{fill(i, "block h-full w-full origin-top bg-lagos-700", "y")}</span>
              <span aria-hidden className="absolute left-1/2 top-[21px] hidden h-0.5 w-full bg-navy-100 lg:block">{fill(i, "block h-full w-full origin-left bg-lagos-700", "x")}</span></>}
            <span className="relative z-10 rounded-full bg-white"><Node n={i + 1} state={s.state} delay={i * 0.12} /></span>
            <span><span className="block text-sm font-semibold leading-tight text-navy-900">{s.label}</span><span className={clsx("mt-0.5 block text-xs", s.state === "PENDING" ? "text-ink-faint" : "text-lagos-700")}>{word[s.state]}</span></span>
          </li>))}
      </ol>
    </section>);
}
