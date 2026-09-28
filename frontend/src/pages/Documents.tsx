import { Download, Eye, FileStack, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui/primitives";
import { Stagger, StaggerItem } from "../components/ui/Stagger";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Tabs } from "../components/ui/Tabs";
import { UploadDialog, type UploadTarget } from "../features/applications/UploadDialog";
import { useDocumentLibrary, type LibraryDoc } from "../features/documents/api";
import { fmtDate, fmtSize } from "../lib/format";

type F = "all" | "attention";
export default function Documents() {
  const r = useDocumentLibrary(), [f, setF] = useState<F>("all"), [q, setQ] = useState(""), [replace, setReplace] = useState<{ d: LibraryDoc; t: UploadTarget } | null>(null);
  const rows = useMemo(() => (r.data?.items ?? []).filter((d) => (f === "all" || ["REJECTED", "EXPIRED"].includes(d.latest.status)) && (!q.trim() || `${d.documentType} ${d.requirementName ?? ""} ${d.latest.originalName} ${d.reference}`.toLowerCase().includes(q.trim().toLowerCase()))), [r.data, f, q]);
  const groups = useMemo(() => { const m = new Map<string, LibraryDoc[]>(); rows.forEach((d) => m.set(d.applicationId, [...(m.get(d.applicationId) ?? []), d])); return [...m.values()]; }, [rows]);
  const attention = (r.data?.items ?? []).filter((d) => ["REJECTED", "EXPIRED"].includes(d.latest.status)).length;
  return (
    <div className="space-y-6">
      <PageHeader title="Documents" subtitle="Everything you've uploaded, across all your applications. Replacing a document keeps the earlier version on record." />
      <Tabs tabs={[{ key: "all", label: "All documents", count: r.data?.items.length }, { key: "attention", label: "Needs attention", count: attention }]} value={f} onChange={setF} label="Document filter" idBase="docs" />
      <label className="relative block max-w-md"><span className="sr-only">Search documents</span><Search className="absolute left-3 top-3 h-5 w-5 text-ink-faint" aria-hidden /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or reference" className="h-11 w-full rounded-lg border border-surface-line bg-white pl-10 pr-3" /></label>
      <div id="docs-panel" role="tabpanel" aria-labelledby={`docs-${f}`}>
        {r.isLoading ? <div className="space-y-3" aria-busy="true"><Skeleton className="h-24" /><Skeleton className="h-24" /></div> : r.isError ? <ErrorState title="We couldn't load your documents" error={r.error} onRetry={() => r.refetch()} />
          : !groups.length ? <EmptyState Icon={FileStack} title={f === "attention" ? "Nothing needs attention" : q ? "No matching documents" : "No documents yet"} body={f === "attention" ? "Every document you've uploaded is in good standing." : q ? "Try a different name or reference." : "Documents you upload to an application appear here."} action={!q && f === "all" ? <Link to="/dashboard"><Button>Go to dashboard</Button></Link> : undefined} />
          : <Stagger className="space-y-5" key={`${f}-${q}`}>{groups.map((g) => (
            <StaggerItem key={g[0].applicationId}><Card className="overflow-hidden">
              <div className="border-b border-surface-line bg-surface-muted px-5 py-3"><Link to={`/applications/${g[0].applicationId}`} className="font-bold text-navy-900 hover:underline">{g[0].reference}</Link><span className="ml-2 text-sm text-ink-soft">{g[0].projectTitle}</span></div>
              <ul className="divide-y divide-surface-line">{g.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                  <span className="min-w-0 flex-1 basis-56"><span className="block font-semibold text-navy-900">{d.requirementName ?? d.documentType}</span><span className="block truncate text-sm text-ink-soft">{d.latest.originalName} · {fmtSize(d.latest.fileSize)} · v{d.latest.version} · {fmtDate(d.latest.uploadedAt)}</span>
                    {d.latest.rejectionReason && <span className="mt-1 block text-sm text-danger">{d.latest.rejectionReason}</span>}</span>
                  <StatusBadge status={d.latest.status} />
                  <span className="flex gap-1">
                    <a className="grid h-11 w-11 place-items-center rounded-full text-navy-700 hover:bg-navy-100/60" target="_blank" rel="noreferrer" href={`/api/documents/${d.id}/download?preview=1`} aria-label={`View ${d.latest.originalName}`}><Eye className="h-5 w-5" aria-hidden /></a>
                    <a className="grid h-11 w-11 place-items-center rounded-full text-navy-700 hover:bg-navy-100/60" href={`/api/documents/${d.id}/download`} aria-label={`Download ${d.latest.originalName}`}><Download className="h-5 w-5" aria-hidden /></a>
                    {["REQUIRED", "ACTION_NEEDED", null].includes(d.requirementStatus) || ["REJECTED", "EXPIRED"].includes(d.latest.status) ? <button className="grid h-11 w-11 place-items-center rounded-full text-navy-700 hover:bg-navy-100/60" aria-label={`Replace ${d.requirementName ?? d.documentType}`} onClick={() => setReplace({ d, t: { requirementId: d.requirementId ?? undefined, name: d.requirementName ?? d.documentType, documentType: d.documentType, reason: d.latest.rejectionReason } })}><RefreshCw className="h-5 w-5" aria-hidden /></button> : null}
                  </span></li>))}</ul></Card></StaggerItem>))}</Stagger>}
      </div>
      {replace && <UploadDialog target={replace.t} appId={replace.d.applicationId} open onClose={() => setReplace(null)} />}
    </div>);
}
