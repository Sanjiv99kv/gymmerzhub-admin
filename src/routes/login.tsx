import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "../components/admin/auth-shell";
import { formatApiError } from "../lib/api";
import {
  getAdminSession,
  loginAdmin,
  setAdminSession,
} from "../lib/admin-auth";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && getAdminSession()) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in — GymmerzHub Admin" },
      {
        name: "description",
        content: "Sign in to the GymmerzHub platform admin console.",
      },
    ],
  }),
  component: LoginPage,
});

function Field({
  id,
  label,
  children,
  action,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
        >
          {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await loginAdmin(email, password);
      setAdminSession(session);
      toast.success(`Welcome back, ${session.admin.fullName}`);
      navigate({ to: "/" });
    } catch (err) {
      const message = formatApiError(err, "Could not sign in");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-12 w-full border border-white/10 bg-white/[0.03] px-3.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-[border-color,background-color] focus:border-lime/60 focus:bg-white/[0.05]";

  return (
    <AuthShell
      title="GymmerzHub"
      subtitle="Authenticate to open the operations console."
      footer={
        <span className="inline-flex items-center gap-2">
          <span className="text-lime">▸</span>
          operators only · session logged
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field id="email" label="operator@email">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@gymmerzhub.com"
            autoComplete="email"
            required
            autoFocus
            className={inputClass}
          />
        </Field>

        <Field
          id="password"
          label="passphrase"
          action={
            <button
              type="button"
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-lime/80 hover:text-lime transition-colors"
              onClick={() => toast.message("Ask a super admin to reset your password.")}
            >
              reset?
            </button>
          }
        >
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              required
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {error && (
          <div
            role="alert"
            className="border border-red-500/30 bg-red-500/10 px-3 py-2.5 font-mono text-xs text-red-300"
          >
            err · {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 bg-lime font-mono text-sm font-semibold tracking-wide text-lime-foreground transition-[filter,transform] hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              authenticating…
            </>
          ) : (
            <>
              enter console
              <span className="text-lime-foreground/50 transition-transform group-hover:translate-x-0.5">→</span>
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
