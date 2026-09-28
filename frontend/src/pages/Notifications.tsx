import { Bell, BellOff, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui/primitives";
import { Stagger, StaggerItem } from "../components/ui/Stagger";
import { Tabs } from "../components/ui/Tabs";
import { useToast } from "../components/ui/Toast";
import { useNoticeActions, useNotifications } from "../features/notifications/api";
import { timeAgo } from "../lib/format";

export default function Notifications() {
  const [filter, setFilter] = useState<"all" | "unread">("all"), [page, setPage] = useState(1), nav = useNavigate(), toast = useToast();
  const r = useNotifications({ filter, page }), { read, readAll } = useNoticeActions();
  const open = (n: { id: string; link: string | null; readAt: string | null }) => { if (!n.readAt) read.mutate(n.id); if (n.link) nav(n.link); };
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Updates on your applications and messages." action={<Button variant="secondary" disabled={!r.data?.unread} loading={readAll.isPending} onClick={() => readAll.mutate(undefined, { onSuccess: () => toast("success", "All notifications marked as read.") })}><CheckCheck className="h-4 w-4" aria-hidden />Mark all as read</Button>} />
      <Tabs tabs={[{ key: "all", label: "All" }, { key: "unread", label: "Unread", count: r.data?.unread }]} value={filter} onChange={(k) => { setFilter(k); setPage(1); }} label="Notification filter" idBase="notes" />
      <div id="notes-panel" role="tabpanel" aria-labelledby={`notes-${filter}`}>
        {r.isLoading ? <div className="space-y-3" aria-busy="true"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
          : r.isError ? <ErrorState title="We couldn't load your notifications" error={r.error} onRetry={() => r.refetch()} />
          : !r.data!.items.length ? <EmptyState Icon={filter === "unread" ? BellOff : Bell} title={filter === "unread" ? "You're all caught up" : "No notifications yet"} body={filter === "unread" ? "There's nothing new to read." : "We'll tell you here when something happens on your application."} />
          : <><Stagger as="ul" key={`${filter}-${page}`} className="divide-y divide-surface-line overflow-hidden rounded-xl border border-surface-line bg-white shadow-card">{r.data!.items.map((n) => (
              <StaggerItem as="li" key={n.id}><button onClick={() => open(n)} className={`flex min-h-16 w-full items-start gap-3 p-4 text-left transition-colors hover:bg-lagos-50/70 ${n.readAt ? "" : "bg-lagos-50/40"}`}>
                <span className="mt-1.5 grid h-3 w-3 shrink-0 place-items-center" aria-hidden>{!n.readAt && <span className="h-2.5 w-2.5 rounded-full bg-lagos-700" />}</span>
                <span className="min-w-0 flex-1"><span className={`block ${n.readAt ? "font-medium" : "font-bold"} text-navy-900`}>{!n.readAt && <span className="sr-only">Unread: </span>}{n.title}</span><span className="block text-sm text-ink-soft">{n.body}</span></span>
                <span className="shrink-0 text-xs text-ink-faint">{timeAgo(n.createdAt)}</span></button></StaggerItem>))}</Stagger>
            <div className="flex items-center justify-between text-sm"><span className="text-ink-soft" aria-live="polite">{r.data!.total} {r.data!.total === 1 ? "notification" : "notifications"}</span>
              <div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><Button size="sm" variant="secondary" disabled={page * r.data!.pageSize >= r.data!.total} onClick={() => setPage(page + 1)}>Next</Button></div></div></>}
      </div>
    </div>);
}
