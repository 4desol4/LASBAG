import { ArrowLeft, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { Card, ErrorState, PageHeader, Skeleton } from "../components/ui/primitives";
import { Stagger, StaggerItem } from "../components/ui/Stagger";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useToast } from "../components/ui/Toast";
import { JourneyTracker } from "../components/JourneyTracker";
import { useDecision, useReview } from "../features/mda/api";
import { fmtDate } from "../lib/format";
type Action = "approve" | "clarification" | "return" | "escalate";
const labels: Record<Action, string> = { approve: "Approve / recommend approval", clarification: "Request clarification", return: "Return for correction", escalate: "Escalate" };
const done: Record<Action, string> = { approve: "Approval recorded.", clarification: "Clarification requested from the applicant.", return: "Application returned for correction.", escalate: "Application escalated." };
export default function MdaReview() {
  const { id = "" } = useParams(), r = useReview(id), decide = useDecision(id), toast = useToast();
  const [action, setAction] = useState<Action | null>(null), [reason, setReason] = useState(""), [reqId, setReqId] = useState("");
  if (r.isLoading) return <div className="space-y-5" aria-busy="true"><Skeleton className="h-20" /><Skeleton className="h-44" /><Skeleton className="h-72" /></div>;
  if (r.isError) return <ErrorState title="We couldn't open this application" error={r.error} onRetry={() => r.refetch()} />;
  const a = r.data!, closed = ["COMPLETED", "CANCELLED", "DRAFT"].includes(a.status);
  const close = () => { setAction(null); setReason(""); setReqId(""); decide.reset(); };
  const submit = () => decide.mutate({ action: action!, reason: reason || (action === "approve" ? "Approved" : ""), requirementId: reqId || undefined }, { onSuccess: () => { toast("success", done[action!]); close(); } });
  return (
    <Stagger className="space-y-5">
      <StaggerItem><Link to="/mda/applications" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-lagos-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden />Back to queue</Link></StaggerItem>
      <StaggerItem><PageHeader eyebrow="Selected application" title={a.reference} subtitle={`${a.project?.title ?? ""} · ${a.applicant.firstName} ${a.applicant.lastName} · ${a.project?.siteAddress ?? ""}`} action={<StatusBadge status={a.status} />} /></StaggerItem>
      <StaggerItem><JourneyTracker stages={a.journey.stages} progress={a.progress} /></StaggerItem>
      <StaggerItem className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Card className="p-5"><h2 className="text-h3 text-navy-900">Requirements checklist</h2>
          <ul className="mt-3 divide-y divide-surface-line">{a.requirements.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3"><span className="min-w-0 flex-1 text-sm font-medium">{q.definition.name}<span className="block text-xs text-ink-faint">{q.definition.agency.code}{q.statusReason ? ` · ${q.statusReason}` : ""}</span></span>
              {q.documents[0] && <a className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-lagos-700 hover:underline" target="_blank" rel="noreferrer" href={`/api/documents/${q.documents[0].id}/download?preview=1`}>View v{q.documents[0].versions[0]?.version}<ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>}
              <StatusBadge status={q.status} /></li>))}</ul></Card>
        <Card className="h-fit p-5"><h2 className="text-h3 text-navy-900">Primary actions</h2>
          {closed ? <p className="mt-3 text-ink-soft">This application is closed for review.</p> :
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{(Object.keys(labels) as Action[]).map((k) => <Button key={k} variant={k === "approve" ? "primary" : k === "escalate" ? "danger" : "secondary"} onClick={() => setAction(k)}>{labels[k]}</Button>)}</div>}
        </Card>
      </StaggerItem>
      <StaggerItem><Card className="p-5"><h2 className="text-h3 text-navy-900">Audit history</h2>
        {!a.history.length ? <p className="mt-2 text-ink-soft">No actions recorded yet.</p> : <ul className="mt-3 divide-y divide-surface-line text-sm">{a.history.map((h) => (
          <li key={h.id} className="flex flex-wrap gap-x-4 gap-y-1 py-2.5"><span className="w-28 text-ink-faint">{fmtDate(h.createdAt)}</span><span className="font-semibold capitalize">{h.action.replace(/_/g, " ").toLowerCase()}</span><span className="text-ink-soft capitalize">{h.role?.toLowerCase().replace("_", " ")}</span>{h.newStatus && <span className="text-ink-soft">{h.previousStatus} → {h.newStatus}</span>}{h.reason && <span className="w-full text-ink-soft">{h.reason}</span>}</li>))}</ul>}</Card></StaggerItem>
      <Dialog open={!!action} onClose={close} title={action ? labels[action] : ""} description={action === "approve" ? "Add a note if it helps the next reviewer." : "The applicant sees your reason in plain language."}>
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
          {action === "clarification" && <label className="block text-sm font-semibold">Requirement<select required value={reqId} onChange={(e) => setReqId(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-surface-line bg-white px-2 font-normal"><option value="">Choose one</option>{a.requirements.map((q) => <option key={q.id} value={q.id}>{q.definition.name}</option>)}</select></label>}
          <label className="block text-sm font-semibold">{action === "approve" ? "Note (optional)" : "Reason"}<textarea data-autofocus required={action !== "approve"} value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-surface-line p-3 font-normal" /></label>
          {decide.isError && <p role="alert" className="text-sm text-danger">{(decide.error as Error).message}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={close}>Cancel</Button><Button type="submit" loading={decide.isPending}>Confirm</Button></div>
        </form>
      </Dialog>
    </Stagger>);
}
