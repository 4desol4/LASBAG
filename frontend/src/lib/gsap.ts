/** GSAP and Lenis are loaded lazily and only by landing-page sections. */
type Gsap = typeof import("gsap")["gsap"];
type ST = typeof import("gsap/ScrollTrigger")["ScrollTrigger"];
let cached: Promise<{ gsap: Gsap; ScrollTrigger: ST }> | null = null;
export function loadGsap() {
  cached ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([g, s]) => { g.gsap.registerPlugin(s.ScrollTrigger); return { gsap: g.gsap, ScrollTrigger: s.ScrollTrigger }; });
  return cached;
}
export async function startLenis() {
  const [{ gsap, ScrollTrigger }, { default: Lenis }] = await Promise.all([loadGsap(), import("lenis")]);
  const lenis = new Lenis({ lerp: 0.1, anchors: true });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (t: number) => lenis.raf(t * 1000);
  gsap.ticker.add(tick); gsap.ticker.lagSmoothing(0);
  return () => { gsap.ticker.remove(tick); lenis.destroy(); };
}
