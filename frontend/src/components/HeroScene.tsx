import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

const sizes = [640, 960, 1440] as const;
const srcSet = (ext: "webp" | "jpg") =>
  sizes.map((w) => `/brand/hero-${w}.${ext} ${w}w`).join(", ");

/** Supplied Lekki bridge photograph, layered for parallax: photo (slow) > mist and light sweep (medium). Transform/opacity only. */
export function HeroScene({
  className = "",
  fade = true,
}: {
  className?: string;
  fade?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const photoY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", reduce ? "0%" : "14%"],
  );
  const mistY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", reduce ? "0%" : "-10%"],
  );
  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-navy-950 grain ${className}`}
    >
      <motion.picture
        style={{ y: photoY }}
        className="absolute inset-x-0 -top-[7%] block h-[114%]"
      >
        <source type="image/webp" srcSet={srcSet("webp")} sizes="100vw" />
        <img
          src="/brand/hero-960.jpg"
          srcSet={srcSet("jpg")}
          sizes="100vw"
          alt=""
          width={1672}
          height={941}
          decoding="async"
          className="h-full w-full object-cover object-[70%_50%] md:object-[62%_50%]"
        />
      </motion.picture>
      {/* legibility: navy wash strongest behind the text, fading toward the bridge */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-950/55 to-navy-950/10 md:from-navy-950/85 md:via-navy-950/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-transparent to-navy-950/40 md:from-navy-950/40" />
      <motion.div
        style={{ y: mistY }}
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent"
      />
      {!reduce && (
        <div className="absolute inset-y-0 left-0 w-1/3 overflow-hidden mix-blend-screen">
          <div className="h-full w-1/2 animate-sweep bg-gradient-to-r from-transparent via-white/12 to-transparent will-change-transform" />
        </div>
      )}
      {fade && (
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-paper" />
      )}
    </div>
  );
}
