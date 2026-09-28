import { motion } from "framer-motion";
import { useId, useRef } from "react";
export interface TabDef<K extends string> { key: K; label: string; count?: number }
/** Tab list with an animated underline. Arrow keys move between tabs; the panel is labelled by the caller via aria-controls ids `${idBase}-panel`. */
export function Tabs<K extends string>({ tabs, value, onChange, label, idBase = "tabs" }: { tabs: TabDef<K>[]; value: K; onChange: (k: K) => void; label: string; idBase?: string }) {
  const layout = useId(), refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const move = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return;
    const next = tabs[(i + d + tabs.length) % tabs.length]; onChange(next.key); refs.current[next.key]?.focus(); e.preventDefault();
  };
  return (
    <div role="tablist" aria-label={label} className="-mx-4 flex gap-1 overflow-x-auto border-b border-surface-line px-4 md:mx-0 md:px-0">
      {tabs.map((t, i) => (
        <button key={t.key} ref={(el) => (refs.current[t.key] = el)} role="tab" id={`${idBase}-${t.key}`} aria-selected={value === t.key} aria-controls={`${idBase}-panel`} tabIndex={value === t.key ? 0 : -1}
          onClick={() => onChange(t.key)} onKeyDown={(e) => move(e, i)} className={`relative min-h-11 shrink-0 whitespace-nowrap px-4 text-sm font-semibold transition-colors ${value === t.key ? "text-lagos-800" : "text-ink-soft hover:text-navy-900"}`}>
          {t.label}{t.count !== undefined && <span className="ml-1.5 rounded-full bg-navy-100 px-1.5 py-0.5 text-xs tabular-nums text-navy-700">{t.count}</span>}
          {value === t.key && <motion.span layoutId={`${layout}-u`} className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-lagos-700" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
        </button>))}
    </div>);
}
