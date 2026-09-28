import { useMutation } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Search, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/primitives";
import { JourneyTracker } from "../components/JourneyTracker";
import { trackReference } from "../features/track/api";
import { fmtDate } from "../lib/format";

/** Public status lookup. Shows stage and progress only: no names, addresses, documents or agency detail. */
export default function Track() {
  const [params, setParams] = useSearchParams(), [ref, setRef] = useState(params.get("ref") ?? ""), reduce = useReducedMotion();
  const m = useMutation({ mutationFn: (r: string) => trackReference(r) });
  useEffect(() => { const r = params.get("ref"); if (r) m.mutate(r); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (e: React.FormEvent) => { e.preventDefault(); const r = ref.trim(); if (!r) return; setParams({ ref: r }); m.mutate(r); };
  return (
    <div className="bg-mint">
      <div className="mx-auto max-w-4xl px-5 py-16 md:py-24 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-lagos-700">Track application</p>
        <h1 className="mt-3 font-display text-h1 text-navy-950">Where is my application?</h1>
        <p className="mt-3 max-w-xl text-lg text-ink-soft">Enter your application reference to see its stage and progress. No sign-in needed.</p>
        <form onSubmit={go} className="mt-8 flex flex-col gap-3 sm:flex-row" role="search">
          <label className="sr-only" htmlFor="ref">Application reference</label>
          <input id="ref" value={ref} onChange={(e) => setRef(e.target.value)} autoComplete="off" placeholder="Application reference" className="h-12 flex-1 rounded-lg border border-surface-line bg-white px-4 text-lg uppercase placeholder:normal-case" />
          <Button size="lg" type="submit" loading={m.isPending}><Search className="h-4 w-4" aria-hidden />Check status</Button>
        </form>
        <p className="mt-3 flex items-start gap-2 text-sm text-ink-soft"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lagos-700" aria-hidden />For privacy, this page never shows names, addresses or documents. <Link to="/login" className="font-semibold text-lagos-700 underline">Sign in</Link> to see everything.</p>
        <div className="mt-10" aria-live="polite">
          {m.isError && <ErrorState title="We couldn't find that application" error={m.error} />}
          {m.data && (
            <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="grid gap-4 rounded-xl border border-surface-line bg-white p-5 shadow-card sm:grid-cols-3">
                {[["Reference", m.data.reference], ["Status", m.data.status], ["Last updated", fmtDate(m.data.updatedAt)]].map(([l, v]) => <div key={l}><p className="text-xs text-ink-faint">{l}</p><p className="font-bold text-navy-900">{v}</p></div>)}
              </div>
              <JourneyTracker stages={m.data.stages} progress={m.data.progress} />
            </motion.div>)}
        </div>
      </div>
    </div>);
}
