import { Link } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Search,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { HeroScene } from "../components/HeroScene";
import { HeroPreviewCards } from "../components/HeroPreviewCards";
import { MaskedLine } from "../components/MaskedLine";
import { startLenis } from "../lib/gsap";
import { useAuth } from "../features/auth/AuthContext";
const HowItWorks = lazy(() => import("../components/landing/HowItWorks"));
const Fragmentation = lazy(() => import("../components/landing/Fragmentation"));
const ConnectedAgencies = lazy(
  () => import("../components/landing/ConnectedAgencies"),
);

const values = [
  {
    Icon: FileText,
    t: "One application",
    d: "Start your building approval journey online.",
    tone: "bg-lagos-100 text-lagos-700",
  },
  {
    Icon: Users,
    t: "Personalised requirements",
    d: "Get the right documents for your project.",
    tone: "bg-navy-100 text-navy-700",
  },
  {
    Icon: BarChart3,
    t: "Transparent status",
    d: "See what is completed, pending and next.",
    tone: "bg-gold-100 text-warn",
  },
  {
    Icon: ClipboardCheck,
    t: "Connected government",
    d: "LASBAG coordinates the relevant agencies.",
    tone: "bg-lagos-100 text-lagos-700",
  },
];

export default function Landing() {
  const { user } = useAuth();
  const canApply =
    !user || user.role === "APPLICANT" || user.role === "PROFESSIONAL";
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll(),
    bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  useEffect(() => {
    if (
      reduce ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    )
      return;
    let stop: (() => void) | undefined,
      dead = false;
    const t = window.setTimeout(() => {
      startLenis().then((s) => {
        if (dead) s();
        else stop = s;
      });
    }, 600);
    return () => {
      dead = true;
      window.clearTimeout(t);
      stop?.();
    };
  }, [reduce]);
  const rise = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: {
            delay: 0.08 * i,
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };
  return (
    <>
      {!reduce && (
        <motion.div
          aria-hidden
          style={{ scaleX: bar }}
          className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gold-500"
        />
      )}
      <section className="relative isolate -mt-[72px] overflow-hidden pt-[72px] text-white">
        <HeroScene />
        <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-7xl content-center gap-10 px-5 pb-24 pt-16 lg:grid-cols-[1.25fr_.75fr] lg:items-center lg:px-8 lg:pb-32">
          <div>
            <motion.p
              {...rise(0)}
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-gold-400"
            >
              <span className="h-px w-8 bg-gold-400" aria-hidden />A smarter
              Lagos. A brighter tomorrow.
            </motion.p>
            <h1 className="font-display text-display">
              <MaskedLine delay={0.15}>One Development.</MaskedLine>
              <MaskedLine delay={0.27}>One Journey.</MaskedLine>
              <MaskedLine delay={0.39} className="italic text-gold-400">
                Connected Government.
              </MaskedLine>
            </h1>
            <motion.p
              {...rise(4)}
              className="mt-7 max-w-xl text-lg text-white/85"
            >
              Citizens, developers and professionals can manage the end-to-end
              building approval process through one coordinated digital gateway.
            </motion.p>
            <motion.div
              {...rise(5)}
              className="mt-9 flex flex-col gap-3 xs:flex-row"
            >
              {canApply && (
                <Link to="/applications/new">
                  <Button
                    size="lg"
                    className="w-full !bg-gold-500 !text-navy-950 hover:!bg-gold-400 xs:w-auto"
                  >
                    Start application{" "}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </Link>
              )}
              <Link to="/track">
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full !text-white ring-1 ring-white/40 hover:!bg-white/10 xs:w-auto"
                >
                  <Search className="h-4 w-4" aria-hidden /> Track application
                </Button>
              </Link>
            </motion.div>
          </div>
          <HeroPreviewCards />
        </div>
      </section>

      <section aria-label="Benefits" className="bg-paper">
        <ul className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {values.map(({ Icon, t, d, tone }) => (
            <li key={t} className="flex gap-4">
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${tone}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-bold text-navy-900">{t}</h2>
                <p className="text-sm text-ink-soft">{d}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Suspense
        fallback={<div className="min-h-[60svh] bg-navy-950" aria-hidden />}
      >
        <HowItWorks />
        <Fragmentation />
        <ConnectedAgencies />
      </Suspense>

      <section className="bg-navy-900">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-5 py-16 md:flex-row md:items-center md:justify-between lg:px-8">
          <h2 className="max-w-xl text-h1 text-white">
            Ready to start your development approval journey?
          </h2>
          <div className="flex flex-wrap gap-3">
            {canApply && (
              <Link to="/applications/new">
                <Button
                  size="lg"
                  className="bg-white !text-navy-900 hover:!bg-lagos-100"
                >
                  Start application{" "}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
            )}
            <Link to="/track">
              <Button
                size="lg"
                variant="ghost"
                className="!text-white ring-1 ring-white/40 hover:!bg-white/10"
              >
                Track application
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
