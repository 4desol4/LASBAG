import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { NavItem } from "./nav";
import type { Badges } from "./NavList";
/** Mobile only. Primary destinations plus a More button that opens the drawer. 44px+ targets, safe-area aware. */
export function BottomNav({ items, badges, onMore }: { items: NavItem[]; badges: Badges; onMore: () => void }) {
  const primary = items.filter((i) => i.primary).slice(0, 4);
  return (
    <nav aria-label="Main" className="glass-light pb-safe fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 md:hidden">
      <ul className="flex items-stretch justify-around px-1">
        {primary.map(({ to, short, Icon, badge }) => (
          <li key={to} className="flex-1">
            <NavLink to={to} end className={({ isActive }) => `flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-lg text-[0.7rem] font-semibold ${isActive ? "text-lagos-800" : "text-ink-soft"}`}>
              {({ isActive }) => (<>
                <span className={`relative grid h-7 w-12 place-items-center rounded-full transition-colors ${isActive ? "bg-lagos-100" : ""}`}><Icon className="h-5 w-5" aria-hidden />
                  {badge && badges[badge] ? <span className="absolute right-1 top-0 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-white" aria-label={`${badges[badge]} unread`} /> : null}</span>{short}</>)}
            </NavLink>
          </li>))}
        <li className="flex-1"><button onClick={onMore} aria-haspopup="dialog" className="flex min-h-[3.5rem] w-full flex-col items-center justify-center gap-0.5 rounded-lg text-[0.7rem] font-semibold text-ink-soft"><span className="grid h-7 w-12 place-items-center"><Menu className="h-5 w-5" aria-hidden /></span>More</button></li>
      </ul>
    </nav>);
}
