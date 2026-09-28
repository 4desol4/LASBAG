import { clsx } from "clsx";
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Inbox, type LucideIcon } from "lucide-react";
import { Button } from "./Button";
import { Counter } from "../Counter";

export const Card = ({
  className,
  ...p
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...p}
    className={clsx(
      "rounded-xl border border-surface-line bg-white shadow-card",
      className,
    )}
  />
);
/** Loading placeholder with a moving highlight (transform only). */
export const Skeleton = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={clsx(
      "relative overflow-hidden rounded-lg bg-navy-100",
      className,
    )}
  >
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent motion-reduce:hidden" />
  </div>
);

export function ProgressBar({
  value,
  label,
  showValue = false,
}: {
  value: number;
  label: string;
  showValue?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-navy-100"
      >
        <motion.div
          className="h-full origin-left rounded-full bg-lagos-700"
          style={{ width: "100%" }}
          initial={{ scaleX: reduce ? value / 100 : 0 }}
          animate={{ scaleX: value / 100 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {showValue && (
        <span className="w-10 text-right text-sm font-semibold tabular-nums text-navy-900">
          <Counter to={value} suffix="%" />
        </span>
      )}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-sm font-semibold text-lagos-700">{eyebrow}</p>
        )}
        <h1 className="font-display text-h1 text-navy-950">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function EmptyState({
  title,
  body,
  action,
  Icon = Inbox,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  Icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-navy-500/30 bg-white/60 px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-lagos-100 text-lagos-700">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="text-h3 text-navy-900">{title}</h3>
      <p className="max-w-sm text-ink-soft">{body}</p>
      {action}
    </div>
  );
}
export function ErrorState({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-danger/25 bg-red-50/60 px-6 py-12 text-center"
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-red-100 text-danger">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="text-h3 text-navy-900">{title}</h3>
      <p className="max-w-sm text-ink-soft">
        {(error as Error)?.message ?? "Something went wrong."}
      </p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </div>
  );
}
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  trailingControl?: ReactNode;
}
export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, hint, className, trailingControl, ...p }, ref) => {
    const id = useId(),
      msg = `${id}-m`;
    return (
      <div className={className}>
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-semibold text-ink"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={error || hint ? msg : undefined}
            className={clsx(
              "h-11 w-full rounded-lg border bg-white px-3 text-[0.95rem] transition-colors duration-fast placeholder:text-ink-faint hover:border-navy-500",
              trailingControl && "pr-11",
              error ? "border-danger" : "border-surface-line",
            )}
            {...p}
          />
          {trailingControl && (
            <div className="absolute inset-y-0 right-1 flex items-center">
              {trailingControl}
            </div>
          )}
        </div>
        {(error || hint) && (
          <p
            id={msg}
            role={error ? "alert" : undefined}
            className={clsx(
              "mt-1.5 text-sm",
              error ? "text-danger" : "text-ink-soft",
            )}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);
Field.displayName = "Field";
