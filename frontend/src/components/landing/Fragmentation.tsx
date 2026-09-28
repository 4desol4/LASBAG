import { CheckCircle2, DoorClosed } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useLgUp } from "../../hooks/useLgUp";
import { loadGsap } from "../../lib/gsap";

const doors = [
  { t: "Physical planning", a: "LASPPPA / EPPPS", x: -90, y: -110, r: -12 },
  { t: "Tax clearance", a: "LIRS", x: 60, y: 90, r: 9 },
  { t: "Drainage", a: "Drainage Services", x: -40, y: 120, r: -7 },
  { t: "Materials testing", a: "LSMTL", x: 110, y: -80, r: 14 },
  { t: "Building control", a: "LASBCA", x: -110, y: 70, r: -10 },
  { t: "Other approvals", a: "Statutory MDAs", x: 70, y: -120, r: 6 },
];
const problems = [
  [
    "Too many handoffs",
    "One development moves across several agency doors and conditional requirements.",
    "border-l-gold-500",
  ],
  [
    "Limited visibility",
    "It isn't always clear what is pending, who owns it, or why it is delayed.",
    "border-l-info",
  ],
  [
    "Costly delays",
    "Manual follow-up and repeated documents slow approvals and raise costs.",
    "border-l-danger",
  ],
];

/** Scroll-scrubbed: scattered agency doors resolve onto one journey line. Elsewhere: the same story, statically resolved. */
export default function Fragmentation() {
  const { lgUp, sentinel } = useLgUp(),
    reduce = useReducedMotion(),
    pinned = lgUp && !reduce;
  const root = useRef<HTMLElement>(null),
    stage = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!pinned) return;
    let dead = false,
      ctx: { revert: () => void } | undefined;
    loadGsap().then(({ gsap }) => {
      if (dead || !root.current) return;
      ctx = gsap.context(() => {
        const q = gsap.utils.selector(root.current!),
          el = q("[data-door]");
        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=220%",
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        tl.fromTo(
          el,
          {
            xPercent: (i: number) => doors[i].x,
            yPercent: (i: number) => doors[i].y,
            rotation: (i: number) => doors[i].r,
            scale: 0.92,
          },
          {
            xPercent: 0,
            yPercent: 0,
            rotation: 0,
            scale: 1,
            duration: 1,
            stagger: 0.04,
          },
          0,
        )
          .fromTo(
            q("[data-alert]"),
            { opacity: 1 },
            { opacity: 0, duration: 0.4 },
            0.6,
          )
          .fromTo(
            q("[data-ok]"),
            { opacity: 0, scale: 0.6 },
            { opacity: 1, scale: 1, duration: 0.4, stagger: 0.03 },
            0.9,
          )
          .fromTo(
            q("[data-line]"),
            { scaleX: 0 },
            { scaleX: 1, duration: 1, ease: "none" },
            0.7,
          )
          .fromTo(
            q("[data-dot]"),
            { x: 0, opacity: 0 },
            {
              x: () => (stage.current?.offsetWidth ?? 800) - 16,
              opacity: 1,
              duration: 1,
              ease: "none",
            },
            0.7,
          )
          .to(q("[data-a]"), { opacity: 0, y: -18, duration: 0.4 }, 0.5)
          .fromTo(
            q("[data-b]"),
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.5 },
            0.9,
          );
      }, root);
    });
    return () => {
      dead = true;
      ctx?.revert();
    };
  }, [pinned]);

  const Door = ({ d, i }: { d: (typeof doors)[number]; i: number }) => (
    <div
      data-door
      className={`${pinned ? "absolute top-1/2 w-[min(9.5rem,11vw)] -translate-y-1/2" : "w-full"}`}
      style={
        pinned
          ? {
              left: `${((i + 0.5) / doors.length) * 100}%`,
              marginLeft: "calc(min(9.5rem, 11vw) / -2)",
            }
          : undefined
      }
    >
      <div className="relative flex h-40 flex-col items-center justify-end rounded-t-[999px] rounded-b-lg border border-navy-900/20 bg-navy-900 px-2 pb-4 text-center text-white shadow-card">
        <span className="absolute left-1/2 top-4 -translate-x-1/2">
          {pinned && (
            <DoorClosed
              data-alert
              className="h-7 w-7 text-gold-400"
              aria-hidden
            />
          )}
          <CheckCircle2
            data-ok
            style={pinned ? { opacity: 0 } : undefined}
            className={`h-7 w-7 text-lagos-100 ${pinned ? "absolute inset-0" : ""}`}
            aria-hidden
          />
        </span>
        <p className="text-sm font-bold leading-tight">{d.t}</p>
        <p className="mt-0.5 text-[0.7rem] text-white/75">{d.a}</p>
      </div>
    </div>
  );

  return (
    <section
      ref={root}
      aria-labelledby="why-h"
      className={`relative overflow-hidden bg-mint ${pinned ? "h-svh" : ""}`}
    >
      {sentinel}
      <div
        className={`mx-auto max-w-7xl px-5 lg:px-8 ${pinned ? "flex h-full flex-col justify-center pt-[72px]" : "py-20 md:py-28"}`}
      >
        <div className={`relative ${pinned ? "h-40" : ""}`}>
          <div data-a className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-lagos-700">
              Why LASBAG
            </p>
            <h2 id="why-h" className="mt-3 font-display text-h1 text-navy-950">
              Today, the applicant becomes the coordinator.
            </h2>
            {!pinned && (
              <p className="mt-4 max-w-2xl text-lg text-ink-soft">
                The controls already exist across Lagos. The gap is the journey
                between them. LASBAG closes that coordination gap; it does not
                replace any agency.
              </p>
            )}
          </div>
          {pinned && (
            <div data-b className="absolute inset-0 max-w-3xl opacity-0">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-lagos-700">
                Why LASBAG
              </p>
              <p className="mt-3 font-display text-h1 text-navy-950">
                One case. One journey.{" "}
                <span className="italic text-lagos-700">
                  Every agency keeps its mandate.
                </span>
              </p>
            </div>
          )}
        </div>
        {!pinned && (
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {problems.map(([t, d, b]) => (
              <li
                key={t}
                className={`rounded-xl border border-l-4 border-surface-line bg-white p-5 ${b}`}
              >
                <h3 className="font-bold text-navy-900">{t}</h3>
                <p className="mt-1 text-ink-soft">{d}</p>
              </li>
            ))}
          </ul>
        )}
        <div
          ref={stage}
          className={pinned ? "relative mt-6 h-[22rem]" : "mt-10"}
        >
          {pinned && (
            <>
              <div
                data-line
                className="absolute left-0 right-0 top-[calc(50%+5.5rem)] h-1 origin-left rounded-full bg-gold-500"
              />
              <span
                data-dot
                className="absolute left-0 top-[calc(50%+5.5rem)] h-4 w-4 -translate-y-1/2 rounded-full bg-gold-500 opacity-0 ring-4 ring-gold-500/30"
                aria-hidden
              />
            </>
          )}
          <ul className={pinned ? "" : "grid grid-cols-2 gap-3 sm:grid-cols-3"}>
            {doors.map((d, i) => (
              <li key={d.t}>
                <Door d={d} i={i} />
              </li>
            ))}
          </ul>
        </div>
        {!pinned && (
          <p className="mt-8 rounded-xl bg-navy-900 p-5 font-medium text-white">
            With LASBAG, one case connects them all. Each agency keeps its legal
            mandate and its own systems.
          </p>
        )}
      </div>
    </section>
  );
}
