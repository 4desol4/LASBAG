import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import type { NavItem } from "./nav";
export type Badges = Partial<Record<NonNullable<NavItem["badge"]>, number>>;
const dot = (n?: number) => (n ? <span className="absolute -right-1 -top-1 grid min-w-[1.15rem] place-items-center rounded-full bg-danger px-1 text-[0.65rem] font-bold leading-[1.15rem] text-white" aria-label={`${n} unread`}>{n > 9 ? "9+" : n}</span> : null);
/** One nav, three shapes: labelled sidebar (xl), icon rail (md to xl), drawer list. */
export function NavList({ items, badges, variant, onNavigate }: { items: NavItem[]; badges: Badges; variant: "sidebar" | "rail" | "drawer"; onNavigate?: () => void }) {
  const rail = variant === "rail";
  return (
    <ul className={rail ? "flex flex-col items-center gap-2" : "space-y-1"}>
      {items.map(({ to, label, Icon, badge }) => (
        <li key={to}>
          <NavLink to={to} end onClick={onNavigate} title={rail ? label : undefined} aria-label={rail ? label : undefined}
            className={({ isActive }) => `relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${rail ? "h-12 w-12 justify-center px-0" : ""} ${variant === "drawer" ? (isActive ? "text-white" : "text-white/85 hover:bg-white/10") : isActive ? "text-lagos-800" : "text-ink-soft hover:bg-navy-100/50 hover:text-navy-900"}`}>
            {({ isActive }) => (<>
              {isActive && <motion.span layoutId={`pill-${variant}`} className={`absolute inset-0 rounded-xl ${variant === "drawer" ? "bg-white/15" : "bg-lagos-100"}`} transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <span className="relative inline-block"><Icon className="h-5 w-5 shrink-0" aria-hidden />{badge && dot(badges[badge])}</span>
              {!rail && <span className="relative">{label}</span>}
            </>)}
          </NavLink>
        </li>))}
    </ul>);
}
