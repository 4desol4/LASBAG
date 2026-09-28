import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CheckCircle2, Circle, Clock3 } from "lucide-react";
export type RowState = "required" | "done" | "review" | "later" | "action";
const chip: Record<RowState, { cls: string; Icon: typeof Circle }> = {
  required: { cls: "bg-navy-100 text-navy-700", Icon: Circle },
  done: { cls: "bg-lagos-100 text-lagos-800", Icon: CheckCircle2 },
  review: { cls: "bg-gold-100 text-warn", Icon: Clock3 },
  later: { cls: "bg-surface-muted text-ink-soft", Icon: Circle },
  action: { cls: "bg-red-50 text-danger", Icon: AlertCircle },
};
/** Sample checklist rows. Statuses always carry an icon and a word. */
export function StepRows({ rows }: { rows: readonly (readonly [string, string, RowState])[] }) {
  const reduce = useReducedMotion();
  return (
    <ul className="space-y-2">
      {rows.map(([label, status, state], i) => { const { cls, Icon } = chip[state]; return (
        <motion.li key={label} initial={reduce ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduce ? 0 : 0.06 * i, duration: 0.35, ease: "easeOut" }} className="flex items-center justify-between gap-3 rounded-lg border border-surface-line bg-white px-3.5 py-2.5 text-sm">
          <span className="font-medium text-navy-900">{label}</span>
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}><Icon className="h-3.5 w-3.5" aria-hidden />{status}</span>
        </motion.li>); })}
    </ul>);
}
