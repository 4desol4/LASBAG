import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate, useOutlet } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../features/auth/AuthContext";
import { useConversations } from "../features/messages/api";
import { useUnread } from "../features/notifications/api";
import { BottomNav } from "./BottomNav";
import { MobileDrawer } from "./MobileDrawer";
import { navFor } from "./nav";
import { NavList } from "./NavList";

/** Shell: sidebar from xl, compact icon rail from md, bottom nav + drawer below md. Calm route transitions. */
export function AppLayout() {
  const { user, logout } = useAuth(), nav = useNavigate(), loc = useLocation(), outlet = useOutlet(), reduce = useReducedMotion();
  const [drawer, setDrawer] = useState(false);
  const items = navFor(user?.role);
  const unread = useUnread().data ?? 0, msgs = (useConversations().data?.items ?? []).reduce((n, c) => n + c.unread, 0);
  const badges = { notifications: unread, messages: msgs };
  const out = async () => { setDrawer(false); await logout(); nav("/"); };
  const home = items[0].to;
  return (
    <div className="min-h-svh bg-paper md:grid md:grid-cols-[4.75rem_1fr] xl:grid-cols-[16.5rem_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded focus:bg-white focus:p-3 focus:text-navy-900">Skip to content</a>
      <aside className="sticky top-0 hidden h-svh flex-col border-r border-surface-line bg-white md:flex">
        <div className="flex h-[4.5rem] items-center justify-center px-3 xl:justify-start xl:px-5"><Link to={home} aria-label="LASBAG home"><span className="xl:hidden"><img src="/brand/lagos-state-crest-96.webp" alt="" width={40} height={40} className="h-10 w-10" /></span><span className="hidden xl:block"><Logo /></span></Link></div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-2 py-3 xl:px-3"><div className="xl:hidden"><NavList items={items} badges={badges} variant="rail" /></div><div className="hidden xl:block"><NavList items={items} badges={badges} variant="sidebar" /></div></nav>
        <div className="border-t border-surface-line p-2 xl:p-3">
          <div className="hidden px-2 pb-2 text-sm xl:block"><p className="truncate font-semibold text-navy-900">{user?.firstName} {user?.lastName}</p><p className="text-xs capitalize text-ink-faint">{user?.role.toLowerCase().replace("_", " ")}</p></div>
          <button onClick={out} title="Sign out" className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl px-3 text-sm font-semibold text-ink-soft hover:bg-navy-100/50 xl:justify-start"><LogOut className="h-5 w-5" aria-hidden /><span className="hidden xl:inline">Sign out</span><span className="sr-only xl:hidden">Sign out</span></button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="glass-light pt-safe sticky top-0 z-30 border-x-0 border-t-0">
          <div className="flex h-14 items-center justify-between gap-3 px-4 md:h-[4.5rem] md:px-8">
            <Link to={home} aria-label="LASBAG home" className="md:hidden"><Logo /></Link>
            <p className="hidden text-sm text-ink-soft md:block">Lagos State Building Approval Gateway</p>
            <div className="flex items-center gap-1">
              <Link to="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative grid h-11 w-11 place-items-center rounded-full text-navy-900 hover:bg-navy-100/60"><Bell className="h-5 w-5" aria-hidden />{unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-white" />}</Link>
              <span className="mx-1 hidden h-6 w-px bg-surface-line md:block" />
              <span className="hidden text-right text-sm md:block"><span className="block font-semibold text-navy-900">{user?.firstName} {user?.lastName}</span></span>
            </div>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1400px] px-4 pb-28 pt-5 outline-none md:px-8 md:pb-10 md:pt-8 2xl:px-12">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={loc.pathname} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>{outlet}</motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BottomNav items={items} badges={badges} onMore={() => setDrawer(true)} />
      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} items={items} badges={badges} user={user} onLogout={out} />
    </div>);
}
