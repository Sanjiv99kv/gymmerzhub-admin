import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Dumbbell, Users, UserPlus, Library, ClipboardList,
  Salad, Sparkles, CreditCard, PercentCircle, Banknote, ShieldCheck,
  Settings as SettingsIcon, ScrollText, Search, Bell, LogOut,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  clearAdminSession,
  getAdminSession,
  logoutAdmin,
  type AdminSession,
} from "../../lib/admin-auth";
import { formatApiError } from "../../lib/api";
import { toast } from "sonner";

type Item = { to: string; label: string; icon: typeof LayoutDashboard };
type Group = { label: string; items: Item[] };

const groups: Group[] = [
  {
    label: "Platform",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/gyms", label: "Gyms", icon: Dumbbell },
      { to: "/members", label: "Members", icon: Users },
      { to: "/join-requests", label: "Join Requests", icon: UserPlus },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/exercises", label: "Exercise Library", icon: Library },
      { to: "/workouts", label: "Workout Templates", icon: ClipboardList },
      { to: "/diets", label: "Diet Templates", icon: Salad },
      { to: "/ai-plans", label: "AI Plans", icon: Sparkles },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/subscriptions", label: "Subscriptions", icon: CreditCard },
      { to: "/revenue-share", label: "Revenue Share", icon: PercentCircle },
      { to: "/payouts", label: "Payouts", icon: Banknote },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admins", label: "Admins", icon: ShieldCheck },
      { to: "/settings", label: "Settings", icon: SettingsIcon },
      { to: "/audit-logs", label: "Audit Logs", icon: ScrollText },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/"));

  useEffect(() => {
    const current = getAdminSession();
    if (!current) {
      navigate({ to: "/login" });
      return;
    }
    setSession(current);
    setReady(true);
  }, [navigate, pathname]);

  const initials = (session?.admin.fullName || "AD")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const onSignOut = async () => {
    try {
      await logoutAdmin();
    } catch (error) {
      clearAdminSession();
      toast.error(formatApiError(error, "Could not sign out"));
    }
    navigate({ to: "/login" });
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground text-sm">
        Loading console…
      </div>
    );
  }

  return (
    <div className="flex h-svh overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-5 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2">
            <img
              src="/gymmerzhub.png"
              alt="GymmerzHub"
              width={28}
              height={28}
              className="h-7 w-7 rounded-md"
            />
            <div>
              <div className="text-sm font-semibold tracking-tight text-foreground">GymmerzHub</div>
              <div className="text-[11px] text-muted-foreground">Admin console</div>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-3 mb-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{g.label}</div>
              <div className="space-y-0.5">
                {g.items.map((item) => {
                  const active = isActive(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-sidebar-accent text-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                      }`}
                    >
                      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-lime" />}
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom admin profile */}
        <div className="shrink-0 border-t border-sidebar-border p-3 space-y-1.5">
          <Link
            to="/profile"
            className={`flex items-center gap-3 rounded-md p-2 transition-colors ${
              isActive("/profile")
                ? "bg-sidebar-accent text-foreground"
                : "bg-sidebar-accent/40 hover:bg-sidebar-accent"
            }`}
          >
            <div className="h-8 w-8 rounded-full bg-lime grid place-items-center text-lime-foreground text-xs font-bold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {session?.admin.fullName ?? "Admin"}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {session?.admin.email ?? "admin@gymmerzhub.com"}
              </div>
            </div>
            <span className="rounded-full bg-lime/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-lime">
              {session?.admin.status ?? "active"}
            </span>
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4 md:px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search gyms, members, templates..."
              className="w-full rounded-md border border-border bg-panel-2 pl-9 pr-3 h-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-lime"
            />
          </div>
          <button className="h-9 w-9 grid place-items-center rounded-md border border-border bg-panel-2 text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
          </button>
          <div className="hidden sm:flex items-center gap-2 rounded-md border border-border bg-panel-2 px-2.5 h-9 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            All systems normal
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
