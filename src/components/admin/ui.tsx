import type { ReactNode } from "react";
import { ChevronDown, MoreHorizontal } from "lucide-react";

export function PageHeader({
  title, subtitle, breadcrumb, actions,
}: { title: string; subtitle?: string; breadcrumb?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {breadcrumb && (
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{breadcrumb}</div>
        )}
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

type BadgeTone = "success" | "warn" | "danger" | "muted" | "info";
export function Badge({ tone = "muted", children }: { tone?: BadgeTone; children: ReactNode }) {
  const tones: Record<BadgeTone, string> = {
    success: "bg-lime/15 text-lime border border-lime/25",
    warn: "bg-amber-500/10 text-amber-300 border border-amber-500/25",
    danger: "bg-red-500/10 text-red-300 border border-red-500/25",
    muted: "bg-muted text-muted-foreground border border-border",
    info: "bg-sky-500/10 text-sky-300 border border-sky-500/25",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const tone: BadgeTone =
    ["active", "verified", "paid", "approved", "published", "completed"].includes(s) ? "success"
    : ["pending", "trialing", "past_due", "past due", "flagged", "paused", "open"].includes(s) ? "warn"
    : ["suspended", "failed", "canceled", "rejected", "hidden", "inactive", "expired", "frozen", "abandoned", "ended"].includes(s) ? "danger"
    : "muted";
  return <Badge tone={tone}>{status.replace("_", " ")}</Badge>;
}

export function StatCard({
  label, value, delta, hint,
}: { label: string; value: string; delta?: string; hint?: string }) {
  const positive = delta?.startsWith("+");
  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">{value}</div>
        {delta && (
          <span className={`text-[11px] font-medium tabular-nums ${positive ? "text-lime" : "text-red-400"}`}>{delta}</span>
        )}
      </div>
      {hint && <div className="mt-2 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Panel({ children, className = "", title, actions }: { children: ReactNode; className?: string; title?: string; actions?: ReactNode }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-panel ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function Button({
  variant = "primary", size = "md", children, className = "", ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" }) {
  const base = "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime disabled:cursor-not-allowed disabled:opacity-50";
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-9 px-4 text-sm" };
  const variants = {
    primary: "bg-lime text-lime-foreground hover:bg-lime/90",
    secondary: "border border-border bg-panel-2 text-foreground hover:bg-accent",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-accent",
    danger: "bg-red-500/15 text-red-300 border border-red-500/25 hover:bg-red-500/25",
  };
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

export function IconButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="grid h-8 w-8 cursor-pointer place-items-center rounded-md border border-border bg-panel-2 text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50" {...props}>
      {children}
    </button>
  );
}

export function RowActions() {
  return <IconButton aria-label="Row actions"><MoreHorizontal className="h-4 w-4" /></IconButton>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {head.map((h) => (
              <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-5 py-3.5 align-middle ${className}`}>{children}</td>;
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="border-b border-border/60 hover:bg-panel-2/50 transition-colors">{children}</tr>;
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-10 w-10 rounded-full border border-border bg-panel-2 mb-4" />
      <div className="text-sm font-medium">{title}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground max-w-sm">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <div className="flex min-w-max items-center gap-1 border-b border-border px-1">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={`relative cursor-pointer px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              active === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
            {active === t && <span className="absolute left-2 right-2 -bottom-px h-[2px] bg-lime" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Select({ children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const classes = className ?? "";
  const hasHeight = /\bh-\S+/.test(classes);
  // Width/height live on the wrapper so the custom chevron stays aligned to the control.
  return (
    <span
      className={`relative inline-flex items-center ${hasHeight ? "" : "h-9"} ${classes}`}
    >
      <select
        {...props}
        className="h-full w-full cursor-pointer appearance-none rounded-md border border-border bg-panel-2 py-0 pl-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-lime disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </span>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-9 rounded-md border border-border bg-panel-2 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-lime ${props.className ?? ""}`}
    />
  );
}
