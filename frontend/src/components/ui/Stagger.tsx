import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } } };
/** Staggered entrance for lists and card grids. Plain render under reduced motion. */
export function Stagger({ as = "div", ...p }: HTMLMotionProps<"div"> & { as?: "div" | "ul" | "ol" }) {
  const reduce = useReducedMotion(), M = motion[as] as typeof motion.div;
  return <M {...p} variants={reduce ? undefined : container} initial={reduce ? false : "hidden"} animate="show" />;
}
export function StaggerItem({ as = "div", ...p }: HTMLMotionProps<"div"> & { as?: "div" | "li" }) {
  const reduce = useReducedMotion(), M = motion[as] as typeof motion.div;
  return <M {...p} variants={reduce ? undefined : item} />;
}
