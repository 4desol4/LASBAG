import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { clsx } from "clsx";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/primitives";
import { homeFor, useAuth } from "../features/auth/AuthContext";
const schema = z
  .object({
    firstName: z.string().min(1, "Enter your first name"),
    lastName: z.string().min(1, "Enter your last name"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(7, "Enter a phone number we can reach you on"),
    accountType: z.enum(["APPLICANT", "PROFESSIONAL"]),
    password: z.string().min(10, "Use at least 10 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  });
type V = z.infer<typeof schema>;
const types = [
  ["APPLICANT", "Applicant", "Building for yourself or your organisation"],
  ["PROFESSIONAL", "Professional", "Architect, engineer, surveyor or planner"],
] as const;
export default function Register() {
  const { register: signUp } = useAuth(),
    nav = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false),
    [showConfirm, setShowConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<V>({
    resolver: zodResolver(schema),
    defaultValues: { accountType: "APPLICANT" },
  });
  const type = watch("accountType");
  const submit = handleSubmit(async ({ confirm, ...v }) => {
    setErr(null);
    try {
      const u = await signUp(v);
      nav(homeFor(u.role), { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    }
  });
  return (
    <AuthShell
      title="Create your account"
      subtitle="One account for every application you make."
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {err && (
          <p
            role="alert"
            className="rounded border border-danger/30 bg-red-50 px-3 py-2.5 text-sm text-danger"
          >
            {err}
          </p>
        )}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            I am registering as
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {types.map(([v, l, d]) => (
              <label
                key={v}
                className={clsx(
                  "cursor-pointer rounded border p-3 transition-colors duration-fast focus-within:ring-2 focus-within:ring-navy-900",
                  type === v
                    ? "border-lagos-700 bg-lagos-50"
                    : "border-surface-line hover:border-navy-500",
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  value={v}
                  checked={type === v}
                  onChange={() => setValue("accountType", v)}
                />
                <span className="block font-semibold">{l}</span>
                <span className="text-sm text-ink-soft">{d}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="First name"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Field
            label="Last name"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Field
          label="Phone number"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Field
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          hint="At least 10 characters"
          error={errors.password?.message}
          trailingControl={
            <button
              type="button"
              onClick={() => setShowPassword((show) => !show)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="grid h-9 w-9 place-items-center rounded text-ink-soft hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          }
          {...register("password")}
        />
        <Field
          label="Confirm password"
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          error={errors.confirm?.message}
          trailingControl={
            <button
              type="button"
              onClick={() => setShowConfirm((show) => !show)}
              aria-label={
                showConfirm ? "Hide confirm password" : "Show confirm password"
              }
              aria-pressed={showConfirm}
              className="grid h-9 w-9 place-items-center rounded text-ink-soft hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          }
          {...register("confirm")}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Create account
        </Button>
        <p className="text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-lagos-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
        {import.meta.env.DEV && (
          <p className="text-center text-sm">
            <Link
              to="/dev/accounts"
              className="font-semibold text-lagos-700 hover:underline"
            >
              View seeded test accounts
            </Link>
          </p>
        )}
      </form>
    </AuthShell>
  );
}
