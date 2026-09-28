import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, X } from "lucide-react";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { Logo } from "../components/Logo";
import { useModal } from "../hooks/useModal";
import type { SessionUser } from "../features/auth/AuthContext";
import type { NavItem } from "./nav";
import { NavList, type Badges } from "./NavList";
/** Slide-in frosted drawer for phones and small tablets. */
export function MobileDrawer({ open, onClose, items, badges, user, onLogout }: { open: boolean; onClose: () => void; items: NavItem[]; badges: Badges; user: SessionUser | null; onLogout: () => void }) {
  const panel = useRef<HTMLDivElement>(null), reduce = useReducedMotion();
  useModal(open, onClose, panel);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div aria-hidden className="absolute inset-0 bg-navy-950/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div ref={panel} role="dialog" aria-modal="true" aria-label="Menu" tabIndex={-1} initial={reduce ? { opacity: 0 } : { x: "100%" }} animate={reduce ? { opacity: 1 } : { x: 0 }} exit={reduce ? { opacity: 0 } : { x: "100%" }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="glass-dark pt-safe pb-safe absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col rounded-l-2xl p-4 text-white">
            <div className="flex items-center justify-between"><Logo light /><button onClick={onClose} aria-label="Close menu" className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10"><X className="h-5 w-5" aria-hidden /></button></div>
            <p className="mt-5 px-3 text-sm text-white/80">{user?.firstName} {user?.lastName}<span className="block text-xs capitalize">{user?.role.toLowerCase().replace("_", " ")}</span></p>
            <nav aria-label="Menu" className="mt-3 flex-1 overflow-y-auto"><NavList items={items} badges={badges} variant="drawer" onNavigate={onClose} /></nav>
            <button onClick={onLogout} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white/90 hover:bg-white/10"><LogOut className="h-5 w-5" aria-hidden />Sign out</button>
          </motion.div>
        </div>)}
    </AnimatePresence>, document.body);
}
