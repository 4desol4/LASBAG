import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, FileText } from "lucide-react";
import { useState } from "react";
import { Card } from "../../components/ui/primitives";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { fmtDate } from "../../lib/format";
import type { ApplicationDetail } from "./api";
import { UploadButton } from "./UploadButton";

const taskText: Record<string, string> = { COMPLETED: "Review completed", IN_PROGRESS: "Under review", WAITING: "Awaiting your submission", QUEUED: "Scheduled later in journey", OVERDUE: "Awaiting update", ESCALATED: "Under senior review" };

export function Checklist({ app }: { app: ApplicationDetail }) {
  const reduce = useReducedMotion();
  if (!app.requirements.length) return <Card className="p-5"><h2 className="text-h3">Requirements checklist</h2><p className="mt-2 text-ink-soft">Your personalised checklist appears once you've described your development.</p></Card>;
  return (
    <Card className="p-5"><h2 className="text-h3 text-navy-900">Requirements checklist</h2>
      <ul className="mt-3 divide-y divide-surface-line">
        <AnimatePresence initial={false}>{app.requirements.map((r) => (
          <motion.li key={r.id} layout={!reduce} initial={reduce ? false : { opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
            <FileText className="h-4 w-4 shrink-0 text-navy-500" aria-hidden />
            <span className="min-w-0 flex-1 text-sm font-medium">{r.definition.name}{r.documents[0] && <span className="ml-2 text-xs text-ink-faint">v{r.documents[0].versions[0]?.version}</span>}</span>
            {["REQUIRED", "ACTION_NEEDED"].includes(r.status) && app.status !== "COMPLETED" && r.definition.stage !== "PLANNING_PERMIT" && app.status !== "DRAFT" ? <UploadButton req={r} appId={app.id} /> : null}
            {app.status === "DRAFT" && r.definition.stage === "SUBMISSION" && <UploadButton req={r} appId={app.id} label={r.documents.length ? "Replace" : "Upload"} />}
            <StatusBadge status={r.status} />
          </motion.li>))}</AnimatePresence>
      </ul>
    </Card>);
}

export function Agencies({ app }: { app: ApplicationDetail }) {
  const by = new Map<string, { name: string; code: string; status: string }>();
  for (const t of app.tasks) { const p = by.get(t.agency.code); if (!p || ["WAITING", "IN_PROGRESS"].includes(t.status)) by.set(t.agency.code, { name: t.agency.name, code: t.agency.code, status: t.status }); }
  return (
    <Card className="p-5"><h2 className="text-h3 text-navy-900">Agency coordination</h2>
      {!by.size ? <p className="mt-2 text-ink-soft">Agencies are contacted once you submit.</p> :
        <ul className="mt-3 divide-y divide-surface-line">{[...by.values()].map((a) => (
          <li key={a.code} className="flex items-center gap-3 py-3"><Building2 className="h-5 w-5 shrink-0 text-navy-500" aria-hidden /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{a.code}</p><p className="truncate text-xs text-ink-soft">{a.name}</p></div><span className="text-right text-xs font-semibold text-ink-soft">{taskText[a.status] ?? a.status}</span></li>))}</ul>}
    </Card>);
}

export function Timeline({ events }: { events: ApplicationDetail["events"] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!events.length) return null;
  return (
    <Card className="p-5"><h2 className="text-h3 text-navy-900">Application timeline</h2>
      <ol className="mt-4 flex gap-0 overflow-x-auto pb-2 md:grid md:grid-flow-col md:auto-cols-fr">{events.map((e) => (
        <li key={e.id} className="relative min-w-[160px] pr-3"><span aria-hidden className="absolute left-0 right-0 top-[9px] h-px bg-lagos-600/30" />
          <button aria-expanded={open === e.id} onClick={() => setOpen(open === e.id ? null : e.id)} className="relative block min-h-11 w-full rounded text-left">
            <span className={`relative z-10 block h-[18px] w-[18px] rounded-full border-2 border-lagos-700 transition-colors ${open === e.id ? "bg-lagos-700" : "bg-white"}`} />
            <span className="mt-2 block text-xs text-ink-faint">{fmtDate(e.createdAt)}</span><span className="block text-sm font-semibold text-navy-900">{e.description}</span></button>
          {open === e.id && <p className="mt-1 text-xs text-ink-soft">{new Date(e.createdAt).toLocaleString("en-GB")} · {e.type.replace(/_/g, " ").toLowerCase()}</p>}</li>))}</ol>
    </Card>);
}
