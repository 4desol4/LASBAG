import { useEffect, useState } from "react";
/** True on devices with a hover-capable mouse. Used to keep cursor effects desktop-only. */
export function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => { const q = window.matchMedia("(hover: hover) and (pointer: fine)"); const f = () => setFine(q.matches); f(); q.addEventListener("change", f); return () => q.removeEventListener("change", f); }, []);
  return fine;
}
