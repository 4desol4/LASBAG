import { Bell, ClipboardList, FileStack, HelpCircle, LayoutDashboard, MessageSquare, PlusCircle, ShieldCheck, type LucideIcon } from "lucide-react";
export interface NavItem { to: string; label: string; short: string; Icon: LucideIcon; primary?: boolean; badge?: "messages" | "notifications" }
const common: NavItem[] = [
  { to: "/messages", label: "Messages", short: "Messages", Icon: MessageSquare, badge: "messages" },
  { to: "/notifications", label: "Notifications", short: "Alerts", Icon: Bell, badge: "notifications" },
  { to: "/help", label: "Help centre", short: "Help", Icon: HelpCircle },
];
const citizen: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", short: "Home", Icon: LayoutDashboard, primary: true },
  { to: "/applications", label: "My applications", short: "Applications", Icon: ClipboardList, primary: true },
  { to: "/applications/new", label: "New application", short: "New", Icon: PlusCircle, primary: true },
  { to: "/documents", label: "Documents", short: "Documents", Icon: FileStack },
  { ...common[0], primary: true }, common[1], common[2],
];
const staff: NavItem[] = [{ to: "/mda/applications", label: "Application queue", short: "Queue", Icon: ClipboardList, primary: true }, { ...common[0], primary: true }, { ...common[1], primary: true }, common[2]];
const admin: NavItem[] = [{ to: "/admin", label: "Overview", short: "Overview", Icon: ShieldCheck, primary: true }, { ...staff[0] }, { ...common[0], primary: true }, common[1], common[2]];
export const navFor = (role?: string): NavItem[] => (role === "ADMIN" || role === "SUPER_ADMIN" ? admin : role === "MDA_OFFICER" ? staff : citizen);
