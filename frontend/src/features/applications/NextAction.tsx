import { ArrowRight, Award, Hourglass, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/primitives";
import { daysLeft, fmtDate } from "../../lib/format";
import type { ApplicationDetail } from "./api";
import { UploadButton } from "./UploadButton";

/** The one thing the applicant should do next. A single restrained pulse draws the eye, then it rests. */
export function NextAction({ app }: { app: ApplicationDetail }) {
  const na = app.nextAction, req = app.requirements.find((r) => r.id === na?.requirementId);
  if (app.status === "COMPLETED") return (
    <Card className="border-lagos-600/40 bg-lagos-50 p-6">
      <Award className="h-9 w-9 text-lagos-700" aria-hidden /><h2 className="mt-3 text-h2 text-lagos-800">Approval journey completed</h2>
      <p className="mt-1 text-ink-soft">Your development approval journey has been completed{app.completedAt ? ` on ${fmtDate(app.completedAt)}` : ""}.</p>
      <div className="mt-5 flex flex-wrap gap-2"><Link to={`/applications/${app.id}`}><Button size="sm" variant="secondary">View application</Button></Link><Button size="sm" variant="secondary" onClick={() => window.print()}>Download application summary</Button></div>
    </Card>);
  if (!na) return null;
  const urgent = na.kind === "UPLOAD" && (na.reason || req?.status === "ACTION_NEEDED"), waiting = na.kind === "WAIT";
  const almost = app.journey.stages.filter((s) => s.state === "COMPLETED").length >= 6, Icon = waiting ? Hourglass : UploadCloud;
  return (
    <div className="relative">
      {!waiting && <span aria-hidden className="pointer-events-none absolute inset-0 animate-attn rounded-xl border-2 border-gold-500 motion-reduce:hidden" />}
      <Card className={`relative h-full p-6 ${urgent ? "border-danger/25 bg-red-50/60" : "border-lagos-600/30 bg-lagos-50"}`}>
        <div className="flex items-start gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${urgent ? "bg-red-100 text-danger" : "bg-lagos-100 text-lagos-700"}`}><Icon className="h-6 w-6" aria-hidden /></span>
          <div><p className="text-sm font-semibold text-ink-soft">{almost ? "You are almost there" : waiting ? "What happens next" : "Next required action"}</p><h2 className="text-h3 text-navy-900 sm:text-h2 2xl:text-h3">{na.title}</h2>
            {na.reason && <p className="mt-1 text-ink-soft">{na.reason} You don't need to restart your application.</p>}</div></div>
        {req?.sla && <p className="mt-4 rounded-lg bg-white px-4 py-3 text-sm"><span className="font-semibold">{daysLeft(req.sla.secondsLeft)}</span> · due {fmtDate(req.sla.dueTime)}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {na.kind === "CONTINUE" ? <Link to={`/applications/new?draft=${app.id}`}><Button>{na.cta} <ArrowRight className="h-4 w-4" aria-hidden /></Button></Link> : req && na.kind === "UPLOAD" ? <UploadButton req={req} appId={app.id} label={na.cta} variant="primary" /> : null}
          <Link to={`/applications/${app.id}`}><Button variant="secondary" size="sm">View details</Button></Link></div>
      </Card>
    </div>);
}
