import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Panel,
  StatusBadge,
  Table,
  Tabs,
  Td,
  Tr,
} from "@/components/admin/ui";
import {
  activityAt,
  activityDetail,
  activityTitle,
  fetchAdminMemberActivity,
  fetchAdminMemberAppPlan,
  fetchAdminMemberDetail,
  fetchAdminMemberDiets,
  fetchAdminMemberMemberships,
  fetchAdminMemberNotes,
  fetchAdminMemberPayments,
  fetchAdminMemberProgress,
  fetchAdminMemberWorkouts,
  measurementArmsCm,
  memberAccountStatus,
  memberDisplayName,
  memberGymCity,
  memberGymLinkStatus,
  memberGymName,
  memberJoinedAt,
  memberLastCheckIn,
  memberMemberCode,
  memberPlanName,
  membershipDiscountLabel,
  membershipEnd,
  membershipPlanLabel,
  membershipPrice,
  membershipStart,
  noteAt,
  noteAuthor,
  paymentPlanLabel,
  planFollowEndsAt,
  planFollowName,
  planFollowStartsAt,
  resolveAppInvoices,
  resolveAppSub,
  resolveGoal,
  updateAdminMemberStatus,
  type AdminMemberActivityItem,
  type AdminMemberAppPlanData,
  type AdminMemberDetail,
  type AdminMemberMeasurement,
  type AdminMemberMembership,
  type AdminMemberNote,
  type AdminMemberOverview,
  type AdminMemberPayment,
  type AdminMemberPlanFollow,
  type AdminMemberProgressData,
  type AdminMemberWeightLog,
} from "@/lib/admin-members";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Dumbbell,
  FileText,
  Hash,
  Loader2,
  Mail,
  Phone,
  Salad,
  Smartphone,
  StickyNote,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/members/$id")({
  head: () => ({
    meta: [
      { title: "Member · GymmerzHub Admin" },
      { name: "description", content: "Member detail for platform admins." },
    ],
  }),
  component: MemberDetailPage,
});

type DetailTab =
  | "Overview"
  | "Memberships"
  | "Payments"
  | "App plan"
  | "Goal"
  | "Progress"
  | "Workouts"
  | "Diets"
  | "Activity"
  | "Notes";

const TABS: DetailTab[] = [
  "Overview",
  "Memberships",
  "Payments",
  "App plan",
  "Goal",
  "Progress",
  "Workouts",
  "Diets",
  "Activity",
  "Notes",
];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(value: number | null | undefined) {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function labelize(value: string | null | undefined) {
  return value ? value.replace(/_/g, " ") : "—";
}

function daysLeft(value: string | null | undefined) {
  if (!value) return null;
  const end = new Date(value).getTime();
  return Number.isNaN(end) ? null : Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium leading-relaxed">{children}</dd>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/50 py-2.5 last:border-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium tabular-nums">{children}</dd>
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <Panel className="flex min-h-56 items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-xs text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin text-lime" />
        {label}
      </div>
    </Panel>
  );
}

function TabError({ error, retry }: { error: string; retry: () => void }) {
  return (
    <Panel>
      <EmptyState
        title="Couldn’t load this data"
        hint={error}
        action={
          <Button size="sm" variant="secondary" onClick={retry}>
            Retry
          </Button>
        }
      />
    </Panel>
  );
}

function MemberDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<DetailTab>("Overview");
  const [overview, setOverview] = useState<AdminMemberOverview | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [memberships, setMemberships] = useState<AdminMemberMembership[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [membershipsError, setMembershipsError] = useState<string | null>(null);
  const [membershipsLoaded, setMembershipsLoaded] = useState(false);

  const [payments, setPayments] = useState<AdminMemberPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);

  const [appPlan, setAppPlan] = useState<AdminMemberAppPlanData | null>(null);
  const [appPlanLoading, setAppPlanLoading] = useState(false);
  const [appPlanError, setAppPlanError] = useState<string | null>(null);
  const [appPlanLoaded, setAppPlanLoaded] = useState(false);

  const [progress, setProgress] = useState<AdminMemberProgressData | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [progressLoaded, setProgressLoaded] = useState(false);

  const [workout, setWorkout] = useState<AdminMemberPlanFollow | null>(null);
  const [workoutLoading, setWorkoutLoading] = useState(false);
  const [workoutError, setWorkoutError] = useState<string | null>(null);
  const [workoutLoaded, setWorkoutLoaded] = useState(false);

  const [diet, setDiet] = useState<AdminMemberPlanFollow | null>(null);
  const [dietLoading, setDietLoading] = useState(false);
  const [dietError, setDietError] = useState<string | null>(null);
  const [dietLoaded, setDietLoaded] = useState(false);

  const [activity, setActivity] = useState<AdminMemberActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityLoaded, setActivityLoaded] = useState(false);

  const [notes, setNotes] = useState<AdminMemberNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesLoaded, setNotesLoaded] = useState(false);

  const handleAuthError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminSession();
        toast.error("Session expired. Please sign in again.");
        navigate({ to: "/login" });
        return true;
      }
      return false;
    },
    [navigate],
  );

  const loadDetail = useCallback(async () => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      setOverview(await fetchAdminMemberDetail(id));
    } catch (err) {
      if (handleAuthError(err)) return;
      const message = formatApiError(err, "Could not load member");
      setDetailError(message);
      setOverview(null);
      toast.error(message);
    } finally {
      setDetailLoading(false);
    }
  }, [handleAuthError, id]);

  const loadMemberships = useCallback(async () => {
    setMembershipsLoading(true);
    setMembershipsError(null);
    try {
      const data = await fetchAdminMemberMemberships(id);
      setMemberships(data.memberships ?? []);
      setMembershipsLoaded(true);
    } catch (err) {
      if (handleAuthError(err)) return;
      const message = formatApiError(err, "Could not load memberships");
      setMembershipsError(message);
      toast.error(message);
    } finally {
      setMembershipsLoading(false);
    }
  }, [handleAuthError, id]);

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const data = await fetchAdminMemberPayments(id);
      setPayments(data.payments ?? []);
      setPaymentsLoaded(true);
    } catch (err) {
      if (handleAuthError(err)) return;
      const message = formatApiError(err, "Could not load payments");
      setPaymentsError(message);
      toast.error(message);
    } finally {
      setPaymentsLoading(false);
    }
  }, [handleAuthError, id]);

  const loadAppPlan = useCallback(async () => {
    setAppPlanLoading(true);
    setAppPlanError(null);
    try {
      setAppPlan(await fetchAdminMemberAppPlan(id));
      setAppPlanLoaded(true);
    } catch (err) {
      if (handleAuthError(err)) return;
      const message = formatApiError(err, "Could not load app plan");
      setAppPlanError(message);
      toast.error(message);
    } finally {
      setAppPlanLoading(false);
    }
  }, [handleAuthError, id]);

  const loadProgress = useCallback(async () => {
    setProgressLoading(true);
    setProgressError(null);
    try {
      setProgress(await fetchAdminMemberProgress(id));
      setProgressLoaded(true);
    } catch (err) {
      if (handleAuthError(err)) return;
      const message = formatApiError(err, "Could not load progress");
      setProgressError(message);
      toast.error(message);
    } finally {
      setProgressLoading(false);
    }
  }, [handleAuthError, id]);

  const loadWorkout = useCallback(async () => {
    setWorkoutLoading(true);
    setWorkoutError(null);
    try {
      const data = await fetchAdminMemberWorkouts(id);
      setWorkout(data.assignment ?? null);
      setWorkoutLoaded(true);
    } catch (err) {
      if (handleAuthError(err)) return;
      const message = formatApiError(err, "Could not load workout");
      setWorkoutError(message);
      toast.error(message);
    } finally {
      setWorkoutLoading(false);
    }
  }, [handleAuthError, id]);

  const loadDiet = useCallback(async () => {
    setDietLoading(true);
    setDietError(null);
    try {
      const data = await fetchAdminMemberDiets(id);
      setDiet(data.assignment ?? null);
      setDietLoaded(true);
    } catch (err) {
      if (handleAuthError(err)) return;
      const message = formatApiError(err, "Could not load diet");
      setDietError(message);
      toast.error(message);
    } finally {
      setDietLoading(false);
    }
  }, [handleAuthError, id]);

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    setActivityError(null);
    try {
      const data = await fetchAdminMemberActivity(id, { page: 1, pageSize: 50 });
      setActivity(data.activities ?? data.activity ?? []);
      setActivityLoaded(true);
    } catch (err) {
      if (handleAuthError(err)) return;
      const message = formatApiError(err, "Could not load activity");
      setActivityError(message);
      toast.error(message);
    } finally {
      setActivityLoading(false);
    }
  }, [handleAuthError, id]);

  const loadNotes = useCallback(async () => {
    setNotesLoading(true);
    setNotesError(null);
    try {
      const data = await fetchAdminMemberNotes(id);
      setNotes(data.notes ?? []);
      setNotesLoaded(true);
    } catch (err) {
      if (handleAuthError(err)) return;
      const message = formatApiError(err, "Could not load notes");
      setNotesError(message);
      toast.error(message);
    } finally {
      setNotesLoading(false);
    }
  }, [handleAuthError, id]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (tab === "Memberships" && !membershipsLoaded) void loadMemberships();
    if (tab === "Payments" && !paymentsLoaded) void loadPayments();
    if (tab === "App plan" && !appPlanLoaded) void loadAppPlan();
    if ((tab === "Goal" || tab === "Progress") && !progressLoaded) void loadProgress();
    if (tab === "Workouts" && !workoutLoaded) void loadWorkout();
    if (tab === "Diets" && !dietLoaded) void loadDiet();
    if (tab === "Activity" && !activityLoaded) void loadActivity();
    if (tab === "Notes" && !notesLoaded) void loadNotes();
  }, [
    activityLoaded,
    appPlanLoaded,
    dietLoaded,
    loadActivity,
    loadAppPlan,
    loadDiet,
    loadMemberships,
    loadNotes,
    loadPayments,
    loadProgress,
    loadWorkout,
    membershipsLoaded,
    notesLoaded,
    paymentsLoaded,
    progressLoaded,
    tab,
    workoutLoaded,
  ]);

  const member = overview?.member ?? null;
  const primaryGym = overview?.primaryGym ?? null;
  const displayMember: AdminMemberDetail | null = useMemo(() => {
    if (!member) return null;
    return {
      ...member,
      planName: overview?.gymMember?.currentMembership?.planName ?? member.planName,
      currentMembership: overview?.gymMember?.currentMembership ?? member.currentMembership,
      gym: primaryGym ?? member.gym,
      gymName: primaryGym?.name ?? member.gymName,
      gymLinkStatus: primaryGym?.status ?? member.gymLinkStatus,
      memberCode: primaryGym?.memberCode ?? member.memberCode,
      joinedAt: primaryGym?.joinedAt ?? member.createdAt ?? member.joinedAt,
    };
  }, [member, overview?.gymMember, primaryGym]);
  const accountStatus = memberAccountStatus(member);
  const goal = resolveGoal(progress);
  const weights = progress?.weights ?? progress?.weightLogs ?? [];
  const measurements = progress?.measurements ?? [];
  const appSub = resolveAppSub(member, appPlan);
  const appInvoices = resolveAppInvoices(member, appPlan);

  const toggleSuspend = async () => {
    if (!overview?.member) return;
    const next = accountStatus === "suspended" ? "active" : "suspended";
    setStatusUpdating(true);
    try {
      const updated = await updateAdminMemberStatus(id, next);
      const payload = "member" in updated ? updated.member : updated;
      setOverview((current) =>
        current
          ? {
              ...current,
              member: { ...current.member, ...payload, accountStatus: next },
            }
          : current,
      );
      toast.success(next === "suspended" ? "Member suspended" : "Member reinstated");
    } catch (err) {
      if (handleAuthError(err)) return;
      toast.error(formatApiError(err, "Could not update member status"));
    } finally {
      setStatusUpdating(false);
    }
  };

  if (detailLoading) return <LoadingPanel label="Loading member…" />;

  if (detailError || !member || !displayMember) {
    return (
      <div className="space-y-4">
        <Link
          to="/members"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-lime"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to members
        </Link>
        <EmptyState
          title={detailError ? "Couldn’t load member" : "Member not found"}
          hint={detailError || "This member is no longer available."}
          action={
            detailError ? (
              <Button size="sm" variant="secondary" onClick={() => void loadDetail()}>
                Retry
              </Button>
            ) : (
              <Link to="/members" className="text-xs font-medium text-lime">
                Back to list
              </Link>
            )
          }
        />
      </div>
    );
  }

  const currentPlan = memberPlanName(displayMember);
  const profile = member.profile;

  return (
    <div className="space-y-6">
      <Link
        to="/members"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-lime"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to members
      </Link>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-panel ring-1 ring-white/[0.05] shadow-[0_18px_44px_-18px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col gap-5 border-b border-border/70 bg-gradient-to-br from-lime/[0.07] via-transparent to-transparent p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-lime text-xl font-bold text-lime-foreground">
              {initials(memberDisplayName(member))}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="truncate text-2xl font-semibold tracking-tight">
                  {memberDisplayName(member)}
                </h1>
                <StatusBadge status={accountStatus} />
                {primaryGym && <StatusBadge status={memberGymLinkStatus(displayMember)} />}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {primaryGym && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {memberGymName(displayMember)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  {memberMemberCode(displayMember)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Joined {formatDate(memberJoinedAt(displayMember))}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant={accountStatus === "suspended" ? "default" : "danger"}
            disabled={statusUpdating}
            onClick={() => void toggleSuspend()}
          >
            {statusUpdating ? "Updating…" : accountStatus === "suspended" ? "Reinstate" : "Suspend"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[
          {
            label: "Gym status",
            value: primaryGym ? labelize(memberGymLinkStatus(displayMember)) : "No gym",
            hint: memberGymCity(displayMember),
            icon: Building2,
          },
          {
            label: "Current plan",
            value: currentPlan,
            hint: "From current membership",
            icon: FileText,
          },
          {
            label: "App plan",
            value: appSub?.planName || "Not loaded",
            hint: appSub?.status ? labelize(appSub.status) : "Open App plan tab",
            icon: Smartphone,
          },
          {
            label: "Account",
            value: labelize(accountStatus),
            hint: "Platform member account",
            icon: Wallet,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border/80 bg-panel p-4 ring-1 ring-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {stat.label}
                  </div>
                  <div className="mt-2 text-xl font-semibold">{stat.value}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{stat.hint}</div>
                </div>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(next) => setTab(next as DetailTab)} />

      {tab === "Overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel title="Contact & identity" className="lg:col-span-2">
              <dl className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
                <Field label="Email">
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {member.email || "—"}
                  </span>
                </Field>
                <Field label="Phone">
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {member.phone || "—"}
                  </span>
                </Field>
                <Field label="Member code">{memberMemberCode(displayMember)}</Field>
                <Field label="Email verified">
                  {member.emailVerifiedAt ? (
                    <Badge tone="success">Verified</Badge>
                  ) : (
                    <Badge tone="warn">Unverified</Badge>
                  )}
                </Field>
                <Field label="Account status">
                  <StatusBadge status={accountStatus} />
                </Field>
              </dl>
            </Panel>
            <Panel title="Gym link">
              <div className="p-5">
                {primaryGym ? (
                  <>
                    <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{primaryGym.name}</div>
                      </div>
                      <StatusBadge status={primaryGym.status || "inactive"} />
                    </div>
                    <dl className="pt-1">
                      <DetailRow label="Joined">{formatDate(primaryGym.joinedAt)}</DetailRow>
                      <DetailRow label="Member code">{primaryGym.memberCode || "—"}</DetailRow>
                    </dl>
                  </>
                ) : (
                  <EmptyState
                    title="No gym membership"
                    hint="This account is not currently linked to a gym."
                  />
                )}
              </div>
            </Panel>
          </div>
          <Panel title="Profile">
            <dl className="grid grid-cols-1 gap-x-8 px-5 pb-4 pt-1 sm:grid-cols-2">
              <DetailRow label="Date of birth">
                {formatDate(profile?.dob || profile?.dateOfBirth)}
              </DetailRow>
              <DetailRow label="Gender">{labelize(profile?.gender)}</DetailRow>
              <DetailRow label="Height">
                {profile?.heightCm != null ? `${profile.heightCm} cm` : "—"}
              </DetailRow>
              <DetailRow label="Weight">
                {profile?.weightKg != null ? `${profile.weightKg} kg` : "—"}
              </DetailRow>
              <DetailRow label="Level">{labelize(profile?.fitnessLevel)}</DetailRow>
              <DetailRow label="Goal">{labelize(profile?.primaryGoal)}</DetailRow>
            </dl>
          </Panel>
        </div>
      )}

      {tab === "Memberships" &&
        (membershipsLoading ? (
          <LoadingPanel label="Loading memberships…" />
        ) : membershipsError ? (
          <TabError error={membershipsError} retry={() => void loadMemberships()} />
        ) : memberships.length === 0 ? (
          <Panel>
            <EmptyState title="No memberships" hint="No gym membership history is available." />
          </Panel>
        ) : (
          <Panel>
            <Table head={["Plan", "Status", "Start", "End", "Price", "Discount", "Method"]}>
              {memberships.map((item) => (
                <Tr key={item.id}>
                  <Td className="font-medium">{membershipPlanLabel(item)}</Td>
                  <Td>
                    <StatusBadge status={item.status || "inactive"} />
                  </Td>
                  <Td>{formatDate(membershipStart(item))}</Td>
                  <Td>{formatDate(membershipEnd(item))}</Td>
                  <Td>{money(membershipPrice(item))}</Td>
                  <Td>{membershipDiscountLabel(item) || "—"}</Td>
                  <Td>{item.paymentMethod || "—"}</Td>
                </Tr>
              ))}
            </Table>
          </Panel>
        ))}

      {tab === "Payments" &&
        (paymentsLoading ? (
          <LoadingPanel label="Loading payments…" />
        ) : paymentsError ? (
          <TabError error={paymentsError} retry={() => void loadPayments()} />
        ) : payments.length === 0 ? (
          <Panel>
            <EmptyState title="No payments" hint="No membership payments are available." />
          </Panel>
        ) : (
          <Panel title="Gym membership payments">
            <Table head={["Amount", "Plan", "Method", "Status", "Paid"]}>
              {payments.map((item) => (
                <Tr key={item.id}>
                  <Td className="font-medium">{money(item.amount)}</Td>
                  <Td>{paymentPlanLabel(item)}</Td>
                  <Td>{item.method || "—"}</Td>
                  <Td>
                    <StatusBadge status={item.status || "inactive"} />
                  </Td>
                  <Td>{formatDate(item.paidAt || item.createdAt)}</Td>
                </Tr>
              ))}
            </Table>
          </Panel>
        ))}

      {tab === "App plan" &&
        (appPlanLoading ? (
          <LoadingPanel label="Loading app plan…" />
        ) : appPlanError ? (
          <TabError error={appPlanError} retry={() => void loadAppPlan()} />
        ) : !appSub && appInvoices.length === 0 ? (
          <Panel>
            <EmptyState title="No app plan" hint="This member has no platform app subscription." />
          </Panel>
        ) : (
          <div className="space-y-4">
            <Panel title={appSub?.planName || "App subscription"}>
              <dl className="grid grid-cols-2 gap-4 p-5">
                <Field label="Status">{labelize(appSub?.status)}</Field>
                <Field label="Price">
                  {appSub?.priceInr != null ? money(appSub.priceInr) : "—"}
                </Field>
                <Field label="Period">
                  {formatDate(appSub?.periodStart || appSub?.currentPeriodStart)} →{" "}
                  {formatDate(appSub?.periodEnd || appSub?.currentPeriodEnd)}
                </Field>
                <Field label="Cancel at end">{appSub?.cancelAtPeriodEnd ? "Yes" : "No"}</Field>
              </dl>
            </Panel>
            <Panel title="App invoices">
              {appInvoices.length === 0 ? (
                <EmptyState title="No invoices" hint="No app invoices are available." />
              ) : (
                <Table head={["Invoice", "Amount", "Status", "Period", "Paid"]}>
                  {appInvoices.map((item) => (
                    <Tr key={item.id}>
                      <Td>{item.invoiceNumber || "—"}</Td>
                      <Td>{money(item.amountInr)}</Td>
                      <Td>
                        <StatusBadge status={item.status || "inactive"} />
                      </Td>
                      <Td>
                        {formatDate(item.periodStart)} → {formatDate(item.periodEnd)}
                      </Td>
                      <Td>{formatDate(item.paidAt)}</Td>
                    </Tr>
                  ))}
                </Table>
              )}
            </Panel>
          </div>
        ))}

      {(tab === "Goal" || tab === "Progress") &&
        (progressLoading ? (
          <LoadingPanel label="Loading progress…" />
        ) : progressError ? (
          <TabError error={progressError} retry={() => void loadProgress()} />
        ) : tab === "Goal" ? (
          <Panel title="Goal">
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Primary goal">{labelize(goal?.primaryGoal)}</Field>
              <Field label="Status">{labelize(goal?.status)}</Field>
              <Field label="Start weight">
                {goal?.startWeightKg != null ? `${goal.startWeightKg} kg` : "—"}
              </Field>
              <Field label="Target weight">
                {goal?.targetWeightKg != null ? `${goal.targetWeightKg} kg` : "—"}
              </Field>
            </div>
            {!goal && (
              <EmptyState title="No active goal" hint="The member has not set a progress goal." />
            )}
          </Panel>
        ) : (
          <div className="space-y-4">
            <Panel title="Weight log">
              {weights.length === 0 ? (
                <EmptyState title="No weight logs" hint="Weight check-ins will appear here." />
              ) : (
                <Table head={["Date", "Weight", "Source", "Note"]}>
                  {weights.map((item: AdminMemberWeightLog) => (
                    <Tr key={item.id}>
                      <Td>{formatDate(item.loggedOn)}</Td>
                      <Td>{item.weightKg != null ? `${item.weightKg} kg` : "—"}</Td>
                      <Td>{item.source || "—"}</Td>
                      <Td>{item.note || "—"}</Td>
                    </Tr>
                  ))}
                </Table>
              )}
            </Panel>
            <Panel title="Measurements">
              {measurements.length === 0 ? (
                <EmptyState title="No measurements" hint="Body measurements will appear here." />
              ) : (
                <Table head={["Date", "Chest", "Waist", "Hips", "Arms"]}>
                  {measurements.map((item: AdminMemberMeasurement) => (
                    <Tr key={item.id}>
                      <Td>{formatDate(item.loggedOn)}</Td>
                      <Td>{item.chestCm ?? "—"}</Td>
                      <Td>{item.waistCm ?? "—"}</Td>
                      <Td>{item.hipsCm ?? "—"}</Td>
                      <Td>{measurementArmsCm(item) ?? "—"}</Td>
                    </Tr>
                  ))}
                </Table>
              )}
            </Panel>
          </div>
        ))}

      {tab === "Workouts" &&
        (workoutLoading ? (
          <LoadingPanel label="Loading workout…" />
        ) : workoutError ? (
          <TabError error={workoutError} retry={() => void loadWorkout()} />
        ) : !workout ? (
          <Panel>
            <EmptyState
              title="No workout assignment"
              hint="No current gym workout assignment is available."
            />
          </Panel>
        ) : (
          <PlanCard plan={workout} icon={Dumbbell} />
        ))}
      {tab === "Diets" &&
        (dietLoading ? (
          <LoadingPanel label="Loading diet…" />
        ) : dietError ? (
          <TabError error={dietError} retry={() => void loadDiet()} />
        ) : !diet ? (
          <Panel>
            <EmptyState
              title="No diet assignment"
              hint="No current gym diet assignment is available."
            />
          </Panel>
        ) : (
          <PlanCard plan={diet} icon={Salad} />
        ))}

      {tab === "Activity" &&
        (activityLoading ? (
          <LoadingPanel label="Loading activity…" />
        ) : activityError ? (
          <TabError error={activityError} retry={() => void loadActivity()} />
        ) : (
          <Panel>
            {activity.length === 0 ? (
              <EmptyState title="No activity" hint="Member activity will appear here." />
            ) : (
              <ul className="divide-y divide-border/50">
                {activity.map((item) => (
                  <li key={item.id} className="flex gap-3 px-5 py-4">
                    <UserRound className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{activityTitle(item)}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {activityDetail(item)}
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(activityAt(item))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ))}
      {tab === "Notes" &&
        (notesLoading ? (
          <LoadingPanel label="Loading notes…" />
        ) : notesError ? (
          <TabError error={notesError} retry={() => void loadNotes()} />
        ) : (
          <Panel>
            {notes.length === 0 ? (
              <EmptyState title="No notes yet" hint="Ops and gym staff notes will show here." />
            ) : (
              <ul className="divide-y divide-border/50">
                {notes.map((note) => (
                  <li key={note.id} className="flex gap-3 px-5 py-4">
                    <StickyNote className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">
                        {noteAuthor(note)}{" "}
                        <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                          {formatDateTime(noteAt(note))}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-foreground/90">{note.body || "—"}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ))}
    </div>
  );
}

function PlanCard({ plan, icon: Icon }: { plan: AdminMemberPlanFollow; icon: typeof Dumbbell }) {
  return (
    <Panel>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon className="mt-1 h-5 w-5 text-lime" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{planFollowName(plan)}</h3>
              <StatusBadge status={plan.status || "inactive"} />
              {plan.source && <Badge tone="muted">{plan.source}</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(planFollowStartsAt(plan))}
              {planFollowEndsAt(plan) ? ` → ${formatDate(planFollowEndsAt(plan))}` : " · ongoing"}
            </p>
            {plan.notes && <p className="mt-1 text-xs text-muted-foreground">{plan.notes}</p>}
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Gym</div>
            <div>{plan.gymName || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Status</div>
            <div>{labelize(plan.status)}</div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
