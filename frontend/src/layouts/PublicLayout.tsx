import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/Button";
import { useAuth, homeFor } from "../features/auth/AuthContext";

const nav = [
  ["How it works", "/#how-it-works"],
  ["Track application", "/track"],
  ["Help", "/help"],
] as const;
export function PublicLayout() {
  const [scrolled, setScrolled] = useState(false),
    [open, setOpen] = useState(false);
  const { user } = useAuth();
  const canApply =
    !user || user.role === "APPLICANT" || user.role === "PROFESSIONAL";
  const onHero = useLocation().pathname === "/" && !scrolled && !open;
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header
        className={`sticky top-0 z-40 pt-safe transition-[background-color,box-shadow] duration-base ${onHero ? "border-b border-transparent text-white" : scrolled || open ? "glass-dark text-white" : "glass-light text-navy-900"}`}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" aria-label="LASBAG home">
            <Logo light={onHero || scrolled || open} />
          </Link>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-9 md:flex"
          >
            {nav.map(([l, to]) => (
              <a
                key={l}
                href={to}
                className="text-[0.95rem] font-medium opacity-90 transition-opacity hover:opacity-100"
              >
                {l}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <Link to={homeFor(user.role)}>
                <Button variant="secondary" size="sm">
                  Go to dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button
                  variant="secondary"
                  size="sm"
                  className={
                    onHero || scrolled
                      ? "!border-white/40 !bg-transparent !text-white hover:!bg-white/10"
                      : ""
                  }
                >
                  Sign in
                </Button>
              </Link>
            )}
            {canApply && (
              <Link to="/applications/new">
                <Button size="sm">Start application</Button>
              </Link>
            )}
          </div>
          <button
            className="grid h-11 w-11 place-items-center rounded md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.nav
              id="mobile-nav"
              aria-label="Mobile"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden border-t border-white/15 md:hidden"
            >
              <div className="flex flex-col gap-1 p-5">
                {nav.map(([l, to]) => (
                  <a
                    key={l}
                    href={to}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded px-2 font-medium"
                  >
                    {l}
                  </a>
                ))}
                <div
                  className={`mt-3 grid gap-3 ${canApply ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  {user ? (
                    <Link
                      to={homeFor(user.role)}
                      onClick={() => setOpen(false)}
                    >
                      <Button variant="secondary" className="w-full">
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/login" onClick={() => setOpen(false)}>
                      <Button variant="secondary" className="w-full">
                        Sign in
                      </Button>
                    </Link>
                  )}
                  {canApply && (
                    <Link to="/applications/new" onClick={() => setOpen(false)}>
                      <Button className="w-full">Start application</Button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="border-t border-surface-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden h-8 w-px bg-surface-line sm:block" />
            <div className="text-sm text-ink-soft">
              <p className="font-semibold text-ink">Lagos State Government</p>
              <p>www.lasbag.gov.ng</p>
            </div>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft"
          >
            <Link to="/help" className="inline-flex min-h-11 items-center">
              Help centre
            </Link>
            <Link to="/track" className="inline-flex min-h-11 items-center">
              Track application
            </Link>
          </nav>
        </div>
        <p className="border-t border-surface-line px-5 py-3 text-center text-xs text-ink-faint">
          Prototype with sample data. Nothing shown here is an actual government
          approval.
        </p>
      </footer>
    </>
  );
}
