import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/primitives";
import { homeFor, useAuth } from "../features/auth/AuthContext";
const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean().optional(),
});
export default function Login() {
  const { login } = useAuth(),
    nav = useNavigate(),
    loc = useLocation() as { state?: { from?: string } };
  const [err, setErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const submit = handleSubmit(async (v) => {
    setErr(null);
    try {
      const u = await login(v.email, v.password);
      nav(loc.state?.from ?? homeFor(u.role), { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    }
  });
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your approval journey."
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
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Field
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
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
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-lagos-700"
            {...register("remember")}
          />{" "}
          Remember me
        </label>
        <Button type="submit" loading={isSubmitting} className="w-full">
          Sign in
        </Button>
        <p className="text-center text-sm text-ink-soft">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-lagos-700 hover:underline"
          >
            Create one
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
