import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, LogOut, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  Panel,
  Button,
  Input,
  StatusBadge,
  Badge,
} from "@/components/admin/ui";
import { formatApiError, ApiError } from "@/lib/api";
import {
  changeAdminPassword,
  clearAdminSession,
  fetchAdminMe,
  fetchAdminSessions,
  getAdminSession,
  logoutAdmin,
  revokeAdminSession,
  updateAdminProfile,
  type PlatformAdmin,
  type PlatformAdminDeviceSession,
} from "@/lib/admin-auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · GymmerzHub Admin" },
      { name: "description", content: "Your platform admin profile and security settings." },
    ],
  }),
  component: ProfilePage,
});

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </label>
        {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function formatWhen(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function ProfilePage() {
  const navigate = useNavigate();
  const cached = getAdminSession()?.admin ?? null;

  const [admin, setAdmin] = useState<PlatformAdmin | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [fullName, setFullName] = useState(cached?.fullName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [sessions, setSessions] = useState<PlatformAdminDeviceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, activeSessions] = await Promise.all([
          fetchAdminMe(),
          fetchAdminSessions(),
        ]);
        if (cancelled) return;
        setAdmin(me);
        setFullName(me.fullName);
        setSessions(activeSessions);
      } catch (error) {
        if (cancelled) return;
        toast.error(formatApiError(error, "Could not load profile"));
        if (error instanceof ApiError && error.status === 401) {
          clearAdminSession();
          navigate({ to: "/login" });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSessionsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const initials = (admin?.fullName || "AD")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateAdminProfile(fullName);
      setAdmin(updated);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(formatApiError(error, "Could not update profile"));
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await changeAdminPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch (error) {
      toast.error(formatApiError(error, "Could not change password"));
    } finally {
      setSavingPassword(false);
    }
  };

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await logoutAdmin();
    } catch (error) {
      clearAdminSession();
      toast.error(formatApiError(error, "Could not sign out"));
    }
    navigate({ to: "/login" });
  };

  const onRevokeSession = async (session: PlatformAdminDeviceSession) => {
    setRevokingId(session.id);
    try {
      const result = await revokeAdminSession(session.id);
      if (result.current) {
        clearAdminSession();
        toast.success("Current session ended");
        navigate({ to: "/login" });
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      toast.success("Session revoked");
    } catch (error) {
      toast.error(formatApiError(error, "Could not revoke session"));
    } finally {
      setRevokingId(null);
    }
  };

  if (loading && !admin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading profile…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Account"
        title="Profile"
        subtitle="Manage your operator identity and sign-in security."
        actions={
          <Button variant="secondary" onClick={onSignOut} disabled={signingOut}>
            {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Sign out
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left — identity + details + security */}
        <div className="space-y-6 xl:col-span-7">
          <Panel>
            <div className="flex flex-wrap items-center gap-4 px-5 py-5">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-lime text-lg font-bold text-lime-foreground">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-semibold tracking-tight">
                  {admin?.fullName ?? "Admin"}
                </div>
                <div className="mt-0.5 truncate text-sm text-muted-foreground">
                  {admin?.email}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={admin?.status ?? "active"} />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-lime" />
                  Platform admin
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-px border-t border-border bg-border sm:grid-cols-3">
              <div className="bg-panel px-5 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Admin ID
                </div>
                <div className="mt-1 truncate text-xs text-foreground">{admin?.id ?? "—"}</div>
              </div>
              <div className="bg-panel px-5 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Last login
                </div>
                <div className="mt-1 text-xs text-foreground">{formatWhen(admin?.lastLoginAt)}</div>
              </div>
              <div className="bg-panel px-5 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Created
                </div>
                <div className="mt-1 text-xs text-foreground">{formatWhen(admin?.createdAt)}</div>
              </div>
            </div>
          </Panel>

          <Panel title="Personal details">
            <form onSubmit={onSaveProfile} className="space-y-5 px-5 py-5">
              <Field label="Full name">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={120}
                  className="h-11 w-full"
                />
              </Field>
              <Field label="Work email" hint="Email cannot be changed from this console yet.">
                <Input value={admin?.email ?? ""} disabled className="h-11 w-full opacity-70" />
              </Field>
              <div className="pt-1">
                <Button type="submit" disabled={savingProfile || fullName.trim() === admin?.fullName}>
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </form>
          </Panel>

          <Panel title="Security">
            <form onSubmit={onChangePassword} className="space-y-5 px-5 py-5">
              <Field label="Current password">
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11 w-full pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field
                label="New password"
                hint="At least 8 characters, including a letter and a number."
              >
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="h-11 w-full pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm new password">
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-11 w-full"
                />
              </Field>
              <div className="pt-1">
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </div>
            </form>
          </Panel>
        </div>

        {/* Right — active sessions */}
        <div className="xl:col-span-5">
          <Panel
            title="Active sessions"
            actions={
              !sessionsLoading ? (
                <Badge tone="muted">{sessions.length} active</Badge>
              ) : undefined
            }
          >
            {sessionsLoading ? (
              <div className="flex items-center gap-2 px-5 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading sessions…
              </div>
            ) : sessions.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                No active sessions found.
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-panel-2 text-muted-foreground">
                      <MonitorSmartphone className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{session.deviceLabel}</span>
                        {session.current && <Badge tone="success">This device</Badge>}
                      </div>
                      <div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        <div>{session.ipAddress || "Unknown IP"}</div>
                        <div>Active {formatWhen(session.lastActiveAt)}</div>
                        <div>Expires {formatWhen(session.expiresAt)}</div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={session.current ? "danger" : "secondary"}
                      size="sm"
                      className="shrink-0 self-start sm:self-center"
                      disabled={revokingId === session.id}
                      onClick={() => onRevokeSession(session)}
                    >
                      {revokingId === session.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      {session.current ? "Sign out" : "Revoke"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
