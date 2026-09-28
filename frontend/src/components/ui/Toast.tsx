import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type Kind = "success" | "error" | "info";
interface T { id: number; kind: Kind; message: string }
const Ctx = createContext<{ toast: (kind: Kind, message: string) => void } | null>(null);
const icon = { success: CheckCircle2, error: AlertCircle, info: Info } as const;
const tone = { success: "text-lagos-100", error: "text-red-200", info: "text-gold-400" } as const;

/** Frosted toasts. Polite live region so screen readers hear them without stealing focus. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([]), n = useRef(0);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const toast = useCallback((kind: Kind, message: string) => { const id = ++n.current; setItems((l) => [...l.slice(-3), { id, kind, message }]); setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4500); }, [dismiss]);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] md:items-end md:pb-6 md:pr-6">
        <AnimatePresence initial={false}>
          {items.map((t) => { const I = icon[t.kind]; return (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.22 }}
              className="glass-dark pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl p-3.5 pr-2 text-sm text-white">
              <I className={`mt-0.5 h-5 w-5 shrink-0 ${tone[t.kind]}`} aria-hidden /><p className="flex-1 py-0.5">{t.message}</p>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-white/10"><X className="h-4 w-4" aria-hidden /></button>
            </motion.div>); })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>);
}
export const useToast = () => { const c = useContext(Ctx); if (!c) throw new Error("useToast outside ToastProvider"); return c.toast; };
