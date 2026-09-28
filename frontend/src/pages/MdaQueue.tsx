import { ClipboardCheck, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { clsx } from "clsx";
import { Button } from "../components/ui/Button";
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui/primitives";
import { Stagger, StaggerItem } from "../components/ui/Stagger";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Tabs } from "../components/ui/Tabs";
import { useQueue, type Tab } from "../features/mda/api";
import { daysLeft } from "../lib/format";
const labels: Record<Tab, string> = { all: "All", new: "New", in_review: "In review", waiting: "Waiting", due_soon: "Due soon", overdue: "Overdue", completed: "Completed" };
const slaCls: Record<string, string> = { OVERDUE: "text-danger", DUE_SOON: "text-warn", ON_TRACK: "text-ok", COMPLETED: "text-ink-soft" };
const grid = "md:grid-cols-[1.1fr_1.5fr_1fr_8rem_8.5rem]";
export default function MdaQueue() {
  const [tab, setTab] = useState<Tab>("all"), [q, setQ] = useState(""), [dq, setDq] = useState(""), [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const r = useQueue({ tab, q: dq, page });
  const tabs = (Object.keys(labels) as Tab[]).map((k) => ({ key: k, label: labels[k], count: r.data?.counts[k] }));
  return (
    <div className="space-y-6">
      <PageHeader title="Application queue" subtitle="Review and make decisions on applications for your agency." />
      <Tabs tabs={tabs} value={tab} onChange={(k) => { setTab(k); setPage(1); }} label="Queue filter" idBase="queue" />
      <label className="relative block max-w-lg"><span className="sr-only">Search by reference, applicant or project</span><Search className="absolute left-3 top-3 h-5 w-5 text-ink-faint" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by reference, applicant or project" className="h-11 w-full rounded-lg border border-surface-line bg-white pl-10 pr-3" /></label>
      <div id="queue-panel" role="tabpanel" aria-labelledby={`queue-${tab}`}>
        {r.isLoading ? <div className="space-y-3" aria-busy="true"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
          : r.isError ? <ErrorState title="We couldn't load the queue" error={r.error} onRetry={() => r.refetch()} />
          : !r.data!.items.length ? <EmptyState Icon={ClipboardCheck} title="Nothing here" body="No applications match this view." />
          : <Card className="overflow-hidden">
            <div className={`hidden gap-4 border-b border-surface-line bg-surface-muted px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-faint md:grid ${grid}`}><span>Reference</span><span>Applicant / project</span><span>Stage</span><span>Time left</span><span>Status</span></div>
            <Stagger as="ul" className="divide-y divide-surface-line" key={`${tab}-${dq}-${page}`}>{r.data!.items.map((a) => (
              <StaggerItem as="li" key={a.id}><Link to={`/mda/applications/${a.id}`} className={`grid gap-2 p-4 transition-colors hover:bg-lagos-50/70 md:items-center md:px-5 ${grid}`}>
                <span className="font-bold text-navy-900">{a.reference}</span>
                <span className="min-w-0"><span className="block text-sm font-semibold">{a.applicantName}</span><span className="block truncate text-sm text-ink-soft">{a.projectTitle}</span></span>
                <span className="text-sm capitalize"><span className="text-xs text-ink-faint md:hidden">Stage: </span>{a.currentStage.replace(/_/g, " ").toLowerCase()}</span>
                <span className={clsx("text-sm font-semibold", slaCls[a.sla?.state ?? ""])}>{a.sla ? daysLeft(a.sla.secondsLeft) : "-"}</span><span><StatusBadge status={a.status} /></span>
              </Link></StaggerItem>))}</Stagger>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-line p-3 text-sm"><span className="text-ink-soft" aria-live="polite">{r.data!.total} applications</span>
              <div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><Button size="sm" variant="secondary" disabled={page * 10 >= r.data!.total} onClick={() => setPage(page + 1)}>Next</Button></div></div>
          </Card>}
      </div>
    </div>);
}
