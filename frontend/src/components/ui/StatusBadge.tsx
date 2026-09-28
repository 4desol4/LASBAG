import { clsx } from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Circle, Clock, MinusCircle, XCircle } from "lucide-react";
const map: Record<string, { label: string; cls: string; Icon: typeof Circle }> = {
  VERIFIED: { label: "Verified", cls: "bg-lagos-100 text-lagos-800", Icon: CheckCircle2 },
  SUBMITTED: { label: "Submitted", cls: "bg-lagos-100 text-lagos-800", Icon: CheckCircle2 },
  UNDER_REVIEW: { label: "Under review", cls: "bg-navy-100 text-navy-700", Icon: Clock },
  REQUIRED: { label: "Required", cls: "bg-gold-100 text-warn", Icon: Circle },
  ACTION_NEEDED: { label: "Action needed", cls: "bg-red-50 text-danger", Icon: AlertTriangle },
  ACTION_REQUIRED: { label: "Action needed", cls: "bg-red-50 text-danger", Icon: AlertTriangle },
  RETURNED: { label: "Returned", cls: "bg-red-50 text-danger", Icon: AlertTriangle },
  REJECTED: { label: "Rejected", cls: "bg-red-50 text-danger", Icon: XCircle },
  EXPIRED: { label: "Expired", cls: "bg-red-50 text-danger", Icon: XCircle },
  NOT_REQUIRED: { label: "Not required", cls: "bg-surface-muted text-ink-soft", Icon: MinusCircle },
  IN_PROGRESS: { label: "In progress", cls: "bg-gold-100 text-warn", Icon: Clock },
  IN_REVIEW: { label: "In progress", cls: "bg-gold-100 text-warn", Icon: Clock },
  APPROVED: { label: "Approved", cls: "bg-lagos-100 text-lagos-800", Icon: CheckCircle2 },
  UPLOADED: { label: "Uploaded", cls: "bg-navy-100 text-navy-700", Icon: Clock },
  COMPLETED: { label: "Completed", cls: "bg-lagos-100 text-lagos-800", Icon: CheckCircle2 },
  DRAFT: { label: "Draft", cls: "bg-surface-muted text-ink-soft", Icon: Circle },
};
/** Icon + word, never colour alone. Re-keys on change so a status update pops in. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const m = map[status] ?? { label: status.replace(/_/g, " ").toLowerCase(), cls: "bg-surface-muted text-ink-soft", Icon: Circle }, reduce = useReducedMotion();
  return <motion.span key={status} initial={reduce ? false : { opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 26 }} className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", m.cls, className)}><m.Icon className="h-3.5 w-3.5" aria-hidden />{m.label}</motion.span>;
}
