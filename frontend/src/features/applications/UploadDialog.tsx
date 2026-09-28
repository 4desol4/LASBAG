import { useEffect, useState } from "react";
import { Dialog } from "../../components/ui/Dialog";
import { DropZone, type UploadState } from "../../components/ui/DropZone";
import { useToast } from "../../components/ui/Toast";
import { useAppMutations } from "./api";
export interface UploadTarget { requirementId?: string; name: string; documentType: string; reason?: string | null }
/** Upload a document for one requirement: drag and drop, real progress, drawn success check, toast. */
export function UploadDialog({ target, appId, open, onClose }: { target: UploadTarget; appId: string; open: boolean; onClose: () => void }) {
  const { upload } = useAppMutations(appId), toast = useToast();
  const [state, setState] = useState<UploadState>("idle"), [pct, setPct] = useState(0), [name, setName] = useState(""), [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (open) { setState("idle"); setPct(0); setErr(null); setName(""); } }, [open]);
  const go = (file: File) => {
    setName(file.name); setState("uploading"); setPct(0); setErr(null);
    upload.mutate({ file, documentType: target.documentType, requirementId: target.requirementId, onProgress: setPct }, {
      onSuccess: () => { setState("success"); toast("success", `${target.name} uploaded.`); setTimeout(onClose, 1100); },
      onError: (e) => { setState("error"); setErr((e as Error).message); },
    });
  };
  return (
    <Dialog open={open} onClose={state === "uploading" ? () => {} : onClose} title={`Upload: ${target.name}`} description={target.reason ?? "Choose the document for this requirement. Uploading again replaces it and keeps the earlier version on record."}>
      <DropZone onFile={go} state={state} progress={pct} error={err} fileName={name} />
    </Dialog>);
}
