import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, FileText, Upload, Users } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Counter } from "../Counter";
import { useLgUp } from "../../hooks/useLgUp";
import { loadGsap } from "../../lib/gsap";
import { StepRows, type RowState } from "./StepRows";

type Row = readonly [string, string, RowState];
const steps = [
  {
    Icon: FileText,
    t: "Check requirements",
    d: "Describe your project and see exactly which documents you need.",
    stage: "Requirements",
    progress: 14,
    rows: [
      ["Certificate of Occupancy", "Required", "required"],
      ["Structural drawings", "Required", "required"],
      ["Survey plan", "Required", "required"],
      ["Drainage clearance", "If it applies", "later"],
    ] as Row[],
  },
  {
    Icon: Upload,
    t: "Submit application",
    d: "Upload your documents once, in one place.",
    stage: "Submission",
    progress: 29,
    rows: [
      ["Certificate of Occupancy", "Uploaded", "done"],
      ["Structural drawings", "Uploaded", "done"],
      ["Survey plan", "Uploaded", "done"],
      ["Drainage clearance", "Needed", "action"],
    ] as Row[],
  },
  {
    Icon: Users,
    t: "Agency review",
    d: "We coordinate the agencies for you. Each keeps its own mandate.",
    stage: "Agency review",
    progress: 57,
    rows: [
      ["Physical planning", "In review", "review"],
      ["Tax clearance", "Verified", "done"],
      ["Drainage", "In review", "review"],
      ["Materials testing", "Later", "later"],
    ] as Row[],
  },
  {
    Icon: CheckCircle2,
    t: "Track progress",
    d: "Follow every stage and respond only where something is needed.",
    stage: "Planning permit",
    progress: 71,
    rows: [
      ["Planning permit", "Issued", "done"],
      ["Drainage clearance", "Verified", "done"],
      ["Building control handoff", "In progress", "review"],
      ["Stage inspections", "Later", "later"],
    ] as Row[],
  },
];

function Preview({ step }: { step: number }) {
  const s = steps[step],
    reduce = useReducedMotion();
  return (
    <div
      className="rounded-2xl bg-white p-5 shadow-float sm:p-6"
      role="group"
      aria-label="Sample application preview"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
        Sample application
      </p>
      <p className="mt-0.5 font-display text-xl text-navy-900">
        Proposed Mixed-Use Development
      </p>
      <div className="mt-4 flex items-end justify-between text-sm">
        <span className="font-semibold text-navy-900">Stage: {s.stage}</span>
        <span className="tabular-nums text-ink-soft">
          <Counter to={s.progress} suffix="%" duration={0.7} /> complete
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-100">
        <motion.div
          className="h-full origin-left rounded-full bg-lagos-600"
          animate={{ scaleX: s.progress / 100 }}
          transition={{ duration: reduce ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "100%" }}
        />
      </div>
      <div className="mt-5 min-h-[15.5rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <StepRows rows={s.rows} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Desktop: pinned, four steps advance with scroll. Tablet, mobile and reduced motion: a plain vertical timeline with each step's sample rows inline. */
export default function HowItWorks() {
  const { lgUp, sentinel } = useLgUp(),
    reduce = useReducedMotion(),
    pinned = lgUp && !reduce;
  const [active, setActive] = useState(0);
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (!pinned) return;
    let dead = false,
      ctx: { revert: () => void } | undefined;
    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (dead || !root.current) return;
      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "+=260%",
          pin: true,
          onUpdate: (st) =>
            setActive(
              Math.min(
                steps.length - 1,
                Math.floor(st.progress * steps.length),
              ),
            ),
        });
      }, root);
    });
    return () => {
      dead = true;
      ctx?.revert();
    };
  }, [pinned]);
  const cur = pinned ? active : steps.length - 1;
  return (
    <section
      ref={root}
      id="how-it-works"
      aria-labelledby="how-h"
      className={`relative overflow-hidden bg-navy-950 text-white ${pinned ? "h-svh" : ""}`}
    >
      {sentinel}
      <div
        className={`mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:px-8 ${pinned ? "h-full pt-[88px]" : "py-20 md:py-28"}`}
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-400">
            How it works
          </p>
          <h2 id="how-h" className="mt-3 font-display text-h1">
            From application to approval,{" "}
            <span className="italic text-gold-400">in four steps.</span>
          </h2>
          <ol className="relative mt-10 space-y-2">
            <span
              aria-hidden
              className="absolute bottom-6 left-[1.35rem] top-6 w-px bg-white/15"
            />
            <motion.span
              aria-hidden
              className="absolute left-[1.35rem] top-6 w-px origin-top bg-gold-500"
              style={{ height: "calc(100% - 3rem)" }}
              animate={{ scaleY: cur / (steps.length - 1) }}
              transition={{ duration: reduce ? 0 : 0.6, ease: "easeOut" }}
            />
            {steps.map(({ Icon, t, d, rows }, i) => (
              <li
                key={t}
                aria-current={pinned && i === active ? "step" : undefined}
                className={`relative flex gap-4 rounded-xl p-2 transition-opacity duration-base ${pinned && i > active ? "opacity-45" : ""}`}
              >
                <span
                  className={`relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors duration-base ${i <= cur ? "border-gold-500 bg-gold-500 text-navy-950" : "border-white/25 bg-navy-950 text-white"}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-1.5">
                  <h3 className="text-h3">
                    {i + 1}. {t}
                  </h3>
                  <p className="mt-1 text-white/80">{d}</p>
                  {!pinned && (
                    <div className="mt-4 rounded-2xl bg-white p-3 text-ink">
                      <StepRows rows={rows} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
        {pinned && <Preview step={active} />}
      </div>
    </section>
  );
}
