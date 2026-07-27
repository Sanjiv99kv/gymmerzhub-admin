import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

export function PageHeader({
  title, subtitle, breadcrumb, actions,
}: { title: string; subtitle?: string; breadcrumb?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {breadcrumb && (
          <div className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase mb-2">{breadcrumb}</div>
        )}
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>}
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
    ["active", "verified", "paid", "approved", "published"].includes(s) ? "success"
    : ["pending", "trialing", "past_due", "past due", "flagged"].includes(s) ? "warn"
    : ["suspended", "failed", "canceled", "rejected", "hidden", "inactive", "expired"].includes(s) ? "danger"
    : "muted";
  return <Badge tone={tone}>{status.replace("_", " ")}</Badge>;
}

export function StatCard({
  label, value, delta, hint,
}: { label: string; value: string; delta?: string; hint?: string }) {
  const positive = delta?.startsWith("+");
  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{label}</div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {delta && (
          <span className={`text-xs font-medium ${positive ? "text-lime" : "text-red-400"}`}>{delta}</span>
        )}
      </div>
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Panel({ children, className = "", title, actions }: { children: ReactNode; className?: string; title?: string; actions?: ReactNode }) {
  return (
    <div className={`rounded-xl border border-border bg-panel ${className}`}>
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
  const base = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime disabled:opacity-50";
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
    <button className="h-8 w-8 grid place-items-center rounded-md border border-border bg-panel-2 text-muted-foreground hover:text-foreground hover:bg-accent" {...props}>
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
    <div className="flex items-center gap-1 border-b border-border">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`relative px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
            active === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t}
          {active === t && <span className="absolute left-2 right-2 -bottom-px h-[2px] bg-lime" />}
        </button>
      ))}
    </div>
  );
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-9 rounded-md border border-border bg-panel-2 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-lime"
    >{children}</select>
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
