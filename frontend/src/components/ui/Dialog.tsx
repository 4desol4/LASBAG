import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useModal } from "../../hooks/useModal";

/** Accessible modal dialog (role=dialog, labelled, focus-trapped, Esc and backdrop close). Frosted panel; keep forms simple inside. */
export function Dialog({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null), id = useId(), reduce = useReducedMotion();
  useModal(open, onClose, panel);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-end sm:place-items-center">
          <motion.div aria-hidden className="absolute inset-0 bg-navy-950/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div ref={panel} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} aria-describedby={description ? `${id}-d` : undefined} tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="glass-sheet pb-safe relative w-full max-w-lg rounded-t-2xl p-5 sm:m-4 sm:rounded-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id={`${id}-t`} className="text-h3 text-navy-900">{title}</h2>{description && <p id={`${id}-d`} className="mt-1 text-sm text-ink-soft">{description}</p>}</div>
              <button onClick={onClose} aria-label="Close dialog" className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-navy-100/60"><X className="h-5 w-5" aria-hidden /></button>
            </div>
            <div className="mt-4">{children}</div>
          </motion.div>
        </div>)}
    </AnimatePresence>, document.body);
}
