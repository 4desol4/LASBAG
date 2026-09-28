import { AlertOctagon, CheckCircle2, Layers, Users } from "lucide-react";
import { BarChart, Donut, HBars } from "../components/charts";
import { Counter } from "../components/Counter";
import { Card, ErrorState, PageHeader, Skeleton } from "../components/ui/primitives";
import { Stagger, StaggerItem } from "../components/ui/Stagger";
import { useAdminStats } from "../features/admin/api";

const statusLabel: Record<string, string> = { DRAFT: "Draft", SUBMITTED: "Submitted", IN_REVIEW: "In progress", ACTION_REQUIRED: "Waiting for applicant", RETURNED: "Returned", APPROVED: "Approved", REJECTED: "Not approved", COMPLETED: "Completed", CANCELLED: "Cancelled" };
const statusColor: Record<string, string> = { COMPLETED: "#0E6B3A", APPROVED: "#138049", IN_REVIEW: "#E0A526", SUBMITTED: "#F0BC48", ACTION_REQUIRED: "#B42318", RETURNED: "#D92D20", DRAFT: "#8FA3BC", REJECTED: "#7A271A", CANCELLED: "#C5D0DD" };

export default function AdminDashboard() {
  const q = useAdminStats();
  if (q.isLoading) return <div className="space-y-5" aria-busy="true"><Skeleton className="h-10 w-64" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div><Skeleton className="h-64" /></div>;
  if (q.isError) return <ErrorState title="We couldn't load the overview" error={q.error} onRetry={() => q.refetch()} />;
  const d = q.data!, t = d.totals;
  const cards = [{ Icon: Layers, label: "Applications", n: t.applications, tone: "bg-navy-100 text-navy-700" }, { Icon: Users, label: "In progress", n: t.inProgress, tone: "bg-gold-100 text-warn" }, { Icon: CheckCircle2, label: "Completed", n: t.completed, tone: "bg-lagos-100 text-lagos-800" }, { Icon: AlertOctagon, label: "Overdue reviews", n: t.overdueSla, tone: "bg-red-50 text-danger" }];
  return (
    <div className="space-y-6">
      <PageHeader title="Overview" subtitle="How applications are moving across the gateway. Counts only, no personal details." />
      <Stagger className="space-y-5">
        <StaggerItem className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ Icon, label, n, tone }) => (
          <Card key={label} className="flex items-center gap-4 p-5"><span className={`grid h-12 w-12 place-items-center rounded-xl ${tone}`}><Icon className="h-6 w-6" aria-hidden /></span><div><p className="font-display text-4xl leading-none text-navy-950 tabular-nums"><Counter to={n} /></p><p className="mt-1 text-sm text-ink-soft">{label}</p></div></Card>))}</StaggerItem>
        <StaggerItem className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <Card className="p-5"><h2 className="text-h3 text-navy-900">New applications, last 8 weeks</h2><div className="mt-5"><BarChart data={d.weekly} label="New applications per week over the last eight weeks" /></div></Card>
          <Card className="p-5"><h2 className="text-h3 text-navy-900">By status</h2><div className="mt-5"><Donut label="Applications by status" centre={<>{t.averageProgress}%<span className="block text-xs font-medium text-ink-soft">avg progress</span></>} parts={d.byStatus.map((s) => ({ label: statusLabel[s.status] ?? s.status, count: s.count, color: statusColor[s.status] ?? "#8FA3BC" }))} /></div></Card>
        </StaggerItem>
        <StaggerItem className="grid gap-5 xl:grid-cols-2">
          <Card className="p-5"><h2 className="text-h3 text-navy-900">Where open applications are now</h2><div className="mt-5"><HBars label="Open applications by current stage" rows={d.byStage} /></div></Card>
          <Card className="p-5"><h2 className="text-h3 text-navy-900">Agency workload</h2>
            <div className="mt-4 hidden md:block"><table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase tracking-wider text-ink-faint"><th className="pb-2 font-semibold">Agency</th><th className="pb-2 text-right font-semibold">Open</th><th className="pb-2 text-right font-semibold">Overdue</th><th className="pb-2 text-right font-semibold">Done</th></tr></thead>
              <tbody className="divide-y divide-surface-line">{d.agencies.map((a) => <tr key={a.code}><th scope="row" className="py-2.5 text-left font-semibold text-navy-900">{a.code}<span className="block text-xs font-normal text-ink-soft">{a.name}</span></th><td className="text-right tabular-nums">{a.waiting}</td><td className={`text-right tabular-nums ${a.overdue ? "font-bold text-danger" : ""}`}>{a.overdue}</td><td className="text-right tabular-nums">{a.completed}</td></tr>)}</tbody></table></div>
            <ul className="mt-4 divide-y divide-surface-line md:hidden">{d.agencies.map((a) => <li key={a.code} className="py-3"><p className="font-semibold text-navy-900">{a.code} <span className="font-normal text-ink-soft">· {a.name}</span></p><p className="mt-1 text-sm text-ink-soft">Open {a.waiting} · <span className={a.overdue ? "font-bold text-danger" : ""}>Overdue {a.overdue}</span> · Done {a.completed}</p></li>)}</ul>
          </Card>
        </StaggerItem>
      </Stagger>
    </div>);
}
