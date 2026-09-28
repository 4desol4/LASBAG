import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Search, SearchX } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/primitives";
import { faqs } from "../features/help/faq";

function Item({ q, a, open, toggle }: { q: string; a: string; open: boolean; toggle: () => void }) {
  const id = useId(), reduce = useReducedMotion();
  return (
    <li className="border-b border-surface-line last:border-0">
      <h3><button id={`${id}-b`} aria-expanded={open} aria-controls={`${id}-p`} onClick={toggle} className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left font-semibold text-navy-900">{q}<ChevronDown className={`h-5 w-5 shrink-0 text-lagos-700 transition-transform duration-base ${open ? "rotate-180" : ""}`} aria-hidden /></button></h3>
      <AnimatePresence initial={false}>{open && <motion.div id={`${id}-p`} role="region" aria-labelledby={`${id}-b`} initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }} exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden"><p className="pb-5 pr-8 text-ink-soft">{a}</p></motion.div>}</AnimatePresence>
    </li>);
}
export default function Help() {
  const [q, setQ] = useState(""), [open, setOpen] = useState<string | null>(faqs[0].q);
  const shown = useMemo(() => { const t = q.trim().toLowerCase(); return t ? faqs.filter((f) => `${f.q} ${f.a} ${f.tag}`.toLowerCase().includes(t)) : faqs; }, [q]);
  const tags = [...new Set(shown.map((f) => f.tag))];
  return (
    <div className="bg-mint">
      <div className="mx-auto max-w-3xl px-5 py-16 md:py-24 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-lagos-700">Help centre</p>
        <h1 className="mt-3 font-display text-h1 text-navy-950">How can we help?</h1>
        <label className="relative mt-8 block"><span className="sr-only">Search help</span><Search className="absolute left-4 top-3.5 h-5 w-5 text-ink-faint" aria-hidden /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, for example: documents" className="h-12 w-full rounded-xl border border-surface-line bg-white pl-12 pr-4 text-lg" /></label>
        <p className="sr-only" aria-live="polite">{shown.length} {shown.length === 1 ? "answer" : "answers"} found</p>
        <div className="mt-8 space-y-6">
          {!shown.length ? <EmptyState Icon={SearchX} title="No answers found" body="Try one simple word, like documents, account or tracking." /> : tags.map((t) => (
            <section key={t} aria-label={t}><h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-ink-soft">{t}</h2>
              <ul className="rounded-xl border border-surface-line bg-white px-5 shadow-card">{shown.filter((f) => f.tag === t).map((f) => <Item key={f.q} q={f.q} a={f.a} open={open === f.q} toggle={() => setOpen(open === f.q ? null : f.q)} />)}</ul></section>))}
        </div>
        <p className="mt-10 rounded-xl bg-navy-950 p-5 text-white">Can't find what you need? <Link to="/login" className="font-semibold text-gold-400 underline">Sign in</Link> and send a message from your application. This prototype has no live support line.</p>
      </div>
    </div>);
}
