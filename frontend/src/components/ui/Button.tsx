import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
const variants = {
  primary: "bg-lagos-700 text-white hover:bg-lagos-800",
  secondary: "border border-navy-900/30 bg-white text-navy-900 hover:border-navy-900 hover:bg-navy-100/50",
  ghost: "text-navy-900 hover:bg-navy-100/60",
  danger: "bg-danger text-white hover:bg-danger/90",
} as const;
const sizes = { md: "h-11 px-5 text-[0.95rem]", sm: "h-9 px-3.5 text-sm", lg: "h-12 px-6 text-base" } as const;
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: keyof typeof variants; size?: keyof typeof sizes; loading?: boolean }
export function Button({ variant = "primary", size = "md", loading, disabled, className, children, ...p }: ButtonProps) {
  return (
    <button {...p} disabled={disabled || loading} aria-busy={loading || undefined}
      className={clsx("inline-flex items-center justify-center gap-2 rounded font-semibold transition-[background-color,transform] duration-fast active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-55", variants[variant], sizes[size], className)}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}{children}
    </button>);
}
