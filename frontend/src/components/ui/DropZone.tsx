import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
export const ACCEPT = ".pdf,.png,.jpg,.jpeg";
export const MAX_MB = 10;
export type UploadState = "idle" | "uploading" | "success" | "error";
/** Drag-and-drop or click-to-choose. Shows real upload progress, then a drawn success check. */
export function DropZone({ onFile, state, progress, error, fileName }: { onFile: (f: File) => void; state: UploadState; progress: number; error?: string | null; fileName?: string }) {
  const input = useRef<HTMLInputElement>(null), [over, setOver] = useState(false), [local, setLocal] = useState<string | null>(null), reduce = useReducedMotion();
  const take = (f?: File) => {
    if (!f) return;
    if (!/\.(pdf|png|jpe?g)$/i.test(f.name)) return setLocal("Choose a PDF, PNG or JPG file.");
    if (f.size > MAX_MB * 1024 * 1024) return setLocal(`That file is larger than ${MAX_MB} MB. Choose a smaller one.`);
    setLocal(null); onFile(f);
  };
  const msg = local ?? (state === "error" ? error : null);
  return (
    <div>
      <input ref={input} type="file" hidden accept={ACCEPT} onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
      <button type="button" data-autofocus disabled={state === "uploading"} onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]); }}
        aria-label="Choose a file to upload, or drop it here"
        className={`flex min-h-[11rem] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${over ? "border-lagos-700 bg-lagos-50" : "border-navy-500/40 bg-white hover:border-lagos-700 hover:bg-lagos-50/60"}`}>
        {state === "success" ? (
          <>
            <svg viewBox="0 0 52 52" className="h-14 w-14" aria-hidden><motion.circle cx="26" cy="26" r="23" fill="none" stroke="#0E6B3A" strokeWidth="3" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} /><motion.path d="M15 27l8 8 15-17" fill="none" stroke="#0E6B3A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ delay: reduce ? 0 : 0.35, duration: 0.4 }} /></svg>
            <p className="font-semibold text-lagos-800">Uploaded{fileName ? `: ${fileName}` : ""}</p>
          </>
        ) : state === "uploading" ? (
          <>
            <p className="max-w-full truncate font-semibold text-navy-900">{fileName}</p>
            <div role="progressbar" aria-label="Upload progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-navy-100"><div className="h-full origin-left rounded-full bg-lagos-700 transition-transform duration-200" style={{ transform: `scaleX(${progress / 100})` }} /></div>
            <p className="text-sm tabular-nums text-ink-soft">{progress}%</p>
          </>
        ) : (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-lagos-100 text-lagos-700"><UploadCloud className="h-6 w-6" aria-hidden /></span>
            <p className="font-semibold text-navy-900">Drop your file here, or <span className="text-lagos-700 underline">browse</span></p>
            <p className="text-sm text-ink-soft">PDF, PNG or JPG, up to {MAX_MB} MB</p>
          </>)}
      </button>
      {msg && <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-danger"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{msg}</p>}
    </div>);
}
