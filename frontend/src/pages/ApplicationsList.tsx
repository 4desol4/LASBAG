import { ClipboardPlus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, EmptyState, ErrorState, PageHeader, ProgressBar, Skeleton } from "../components/ui/primitives";
import { Stagger, StaggerItem } from "../components/ui/Stagger";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useApplications } from "../features/applications/api";
import { fmtDate } from "../lib/format";

/** Rows on md and up (with column headings); stacked cards on phones. */
export default function ApplicationsList() {
  const [q, setQ] = useState(""), [dq, setDq] = useState("");
  useEffect(() => { const t = setTimeout(() => setDq(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  const r = useApplications({ pageSize: 20, ...(dq && { q: dq }) });
  const grid = "md:grid-cols-[1.6fr_1fr_11rem_8.5rem]";
  return (
    <div className="space-y-6">
      <PageHeader title="My applications" subtitle="Every development you've started, in one place." action={<Link to="/applications/new"><Button>New application</Button></Link>} />
      <label className="relative block max-w-md"><span className="sr-only">Search your applications</span><Search className="absolute left-3 top-3 h-5 w-5 text-ink-faint" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title or reference" className="h-11 w-full rounded-lg border border-surface-line bg-white pl-10 pr-3" /></label>
      {r.isLoading ? <div className="space-y-3" aria-busy="true"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        : r.isError ? <ErrorState title="We couldn't load your applications" error={r.error} onRetry={() => r.refetch()} />
        : !r.data!.items.length ? (dq ? <EmptyState Icon={Search} title="No matches" body="Try a different title or reference number." /> : <EmptyState Icon={ClipboardPlus} title="No applications yet" body="Your building approval journey starts here." action={<Link to="/applications/new"><Button>Start application</Button></Link>} />)
        : <>
          <div className={`hidden gap-4 px-5 text-xs font-semibold uppercase tracking-wider text-ink-faint md:grid ${grid}`}><span>Project</span><span>Last updated</span><span>Progress</span><span>Status</span></div>
          <Stagger as="ul" className="grid gap-3">{r.data!.items.map((a) => (
            <StaggerItem as="li" key={a.id}><Link to={`/applications/${a.id}`} className="block rounded-xl focus-visible:ring-offset-paper"><Card className={`grid gap-3 p-4 transition-shadow hover:shadow-float md:items-center md:px-5 ${grid}`}>
              <div className="min-w-0"><p className="truncate font-bold text-navy-900">{a.project?.title}</p><p className="text-sm text-ink-soft">{a.reference}</p></div>
              <p className="text-sm text-ink-soft"><span className="text-xs text-ink-faint md:hidden">Updated </span>{fmtDate(a.updatedAt)}</p>
              <ProgressBar value={a.progress} label={`${a.reference} progress`} showValue /><div><StatusBadge status={a.status} /></div>
            </Card></Link></StaggerItem>))}</Stagger>
          <p className="text-sm text-ink-soft" aria-live="polite">{r.data!.total} {r.data!.total === 1 ? "application" : "applications"}</p></>}
    </div>);
}
