import { useEffect, useRef, useState } from "react";
/** Reads the Tailwind `lg` breakpoint from the browser via a sentinel element, so breakpoints stay defined only in tailwind.config.ts. */
export function useLgUp() {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const f = () => setOn(getComputedStyle(el).display !== "none");
    f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f);
  }, []);
  return { lgUp: on, sentinel: <span ref={ref} aria-hidden className="hidden lg:block" /> };
}
