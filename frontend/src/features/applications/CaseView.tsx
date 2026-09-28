import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Card } from "../../components/ui/primitives";
import { Stagger, StaggerItem } from "../../components/ui/Stagger";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useToast } from "../../components/ui/Toast";
import { JourneyTracker } from "../../components/JourneyTracker";
import { devType } from "../../lib/format";
import { useAppMutations, type ApplicationDetail } from "./api";
import { Agencies, Checklist, Timeline } from "./CaseParts";
import { NextAction } from "./NextAction";

export function CaseView({ app }: { app: ApplicationDetail }) {
  const { submit } = useAppMutations(app.id), toast = useToast(), [confirm, setConfirm] = useState(false), p = app.project;
  return (
    <Stagger className="space-y-5">
      <StaggerItem><Card className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-5">
        {[["Application reference", app.reference], ["Project title", p?.title ?? "-"], ["Site address", p?.siteAddress || "Not added yet"], ["Development type", p ? devType(p.developmentType) : "-"]].map(([l, v]) => <div key={l} className="min-w-0"><p className="text-xs text-ink-faint">{l}</p><p className="break-words font-bold text-navy-900">{v}</p></div>)}
        <div><p className="text-xs text-ink-faint">Status</p><StatusBadge status={app.status} className="mt-1" /></div>
      </Card></StaggerItem>
      <StaggerItem><JourneyTracker stages={app.journey.stages} progress={app.progress} /></StaggerItem>
      <StaggerItem className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)] [&>*]:min-w-0"><NextAction app={app} /><Checklist app={app} /><div className="lg:col-span-2 2xl:col-span-1"><Agencies app={app} /></div></StaggerItem>
      {app.status === "DRAFT" && app.requirements.length > 0 && (
        <StaggerItem><Card className="flex flex-wrap items-center justify-between gap-3 p-5"><p className="max-w-xl text-ink-soft">Upload your submission documents, then send your application to LASBAG.</p><Button onClick={() => setConfirm(true)}>Submit application</Button></Card></StaggerItem>)}
      <StaggerItem><Timeline events={app.events} /></StaggerItem>
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Submit your application?" description="LASBAG will send it to the agencies that need to review it. You can still respond to any requests for more information.">
        {submit.isError && <p role="alert" className="mb-3 text-sm text-danger">{(submit.error as Error).message}</p>}
        <div className="flex flex-wrap justify-end gap-2"><Button variant="ghost" onClick={() => setConfirm(false)}>Not yet</Button>
          <Button loading={submit.isPending} onClick={() => submit.mutate(undefined, { onSuccess: () => { setConfirm(false); toast("success", "Application submitted. We'll keep you updated here."); } })}>Yes, submit</Button></div>
      </Dialog>
    </Stagger>);
}
