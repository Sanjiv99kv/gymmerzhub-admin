import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Panel,
  StatusBadge,
  Badge,
  Button,
  Table,
  Tr,
  Td,
  Tabs,
  Input,
  Select,
  EmptyState,
} from "@/components/admin/ui";
import {
  fetchAdminGymActivity,
  fetchAdminGymDetail,
  fetchAdminGymMembers,
  fetchAdminGymMemberships,
  fetchAdminGymStaff,
  updateAdminGymStatus,
  type AdminGymActivityItem,
  type AdminGymDetail,
  type AdminGymMember,
  type AdminGymMembershipPlan,
  type AdminGymStaff,
  type PaginationMeta,
} from "@/lib/admin-gyms";
import { ApiError, formatApiError } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";
import {
  ArrowLeft,
  BadgeCheck,
  BellRing,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Dumbbell,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  UserCog,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/gyms/$id")({
  head: () => ({
    meta: [
      { title: "Gym · GymmerzHub Admin" },
      { name: "description", content: "Gym detail for platform admins." },
    ],
  }),
  component: GymDetail,
});

type GymStatus = "active" | "suspended" | "inactive";
type DetailTab = "Overview" | "Members" | "Staff" | "Memberships" | "Activity";

const TABS: DetailTab[] = [
  "Overview",
  "Members",
  "Staff",
  "Memberships",
  "Activity",
];

const MEMBER_PAGE_SIZE_OPTIONS = [5, 10, 20] as const;
const DEFAULT_MEMBER_PAGE_SIZE = 5;
const STAFF_PAGE_SIZE_OPTIONS = [5, 10, 20] as const;
const DEFAULT_STAFF_PAGE_SIZE = 5;
const ACTIVITY_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

const STAFF_ROLES = [
  { value: "owner", label: "Owner" },
  { value: "operator", label: "Operator" },
  { value: "trainer", label: "Trainer" },
] as const;

const ACTIVITY_ICON = {
  join: UserRound,
  payment: CreditCard,
  notice: BellRing,
  staff: UserCog,
  request: Inbox,
  check_in: Dumbbell,
  checkin: Dumbbell,
  attendance: Dumbbell,
} as const;

function pageItems(
  current: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) items.push("ellipsis");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push("ellipsis");
  items.push(totalPages);
  return items;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(value: number | null | undefined) {
  if (value == null) return "—";
  return `₹${value.toLocaleString("en-IN")}`;
}

function dash(value: string | null | undefined) {
  return value?.trim() ? value : "—";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function activityIcon(type: string) {
  const key = type.toLowerCase().replace(/\s+/g, "_");
  return ACTIVITY_ICON[key as keyof typeof ACTIVITY_ICON] ?? Inbox;
}

function activityDetail(item: AdminGymActivityItem) {
  if (item.memberName) return item.memberName;
  const tag = item.metadata?.tag;
  if (typeof tag === "string" && tag) return tag;
  const status = item.metadata?.status;
  if (typeof status === "string" && status) return status;
  return "";
}

function billingLabel(plan: AdminGymMembershipPlan) {
  const n = plan.durationValue;
  const unit = plan.durationUnit?.replace(/s$/, "") || "month";
  if (n === 1) return `Billed every ${unit}`;
  return `Billed every ${n} ${unit}s`;
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  iconWrap,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
  accent: string;
  iconWrap: string;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-panel p-4 ring-1 ring-white/[0.04] shadow-[0_12px_32px_-14px_rgba(0,0,0,0.8)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </div>
          <div
            className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${accent}`}
          >
            {value}
          </div>
          <div className="mt-1 truncate text-[11px] text-muted-foreground">
            {hint}
          </div>
        </div>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border shadow-inner ${iconWrap}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium leading-relaxed">{children}</dd>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/50 py-2.5 last:border-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium tabular-nums">{children}</dd>
    </div>
  );
}

function DistributionBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">
          {value}
          <span className="ml-1.5 text-[11px] text-muted-foreground">{pct}%</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function GymDetail() {
  const { id: gymId } = Route.useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState<DetailTab>("Overview");
  const [detail, setDetail] = useState<AdminGymDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [memberQ, setMemberQ] = useState("");
  const [memberStatus, setMemberStatus] = useState("");
  const [memberPlanId, setMemberPlanId] = useState("");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo] = useState("");
  const [checkInFrom, setCheckInFrom] = useState("");
  const [checkInTo, setCheckInTo] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(DEFAULT_MEMBER_PAGE_SIZE);
  const [members, setMembers] = useState<AdminGymMember[]>([]);
  const [memberPagination, setMemberPagination] =
    useState<PaginationMeta | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);

  const [staffQ, setStaffQ] = useState("");
  const [staffStatus, setStaffStatus] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [staffJoinedFrom, setStaffJoinedFrom] = useState("");
  const [staffJoinedTo, setStaffJoinedTo] = useState("");
  const [staffPage, setStaffPage] = useState(1);
  const [staffPageSize, setStaffPageSize] = useState(DEFAULT_STAFF_PAGE_SIZE);
  const [staff, setStaff] = useState<AdminGymStaff[]>([]);
  const [staffPagination, setStaffPagination] =
    useState<PaginationMeta | null>(null);
  const [staffLoading, setStaffLoading] = useState(false);

  const [memberships, setMemberships] = useState<AdminGymMembershipPlan[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [membershipsLoaded, setMembershipsLoaded] = useState(false);

  const [activity, setActivity] = useState<AdminGymActivityItem[]>([]);
  const [activityPagination, setActivityPagination] =
    useState<PaginationMeta | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [activityLoading, setActivityLoading] = useState(false);

  const debouncedMemberQ = useDebouncedValue(memberQ, SEARCH_DEBOUNCE_MS);
  const debouncedStaffQ = useDebouncedValue(staffQ, SEARCH_DEBOUNCE_MS);

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
      const data = await fetchAdminGymDetail(gymId);
      setDetail(data);
    } catch (err) {
      if (handleAuthError(err)) return;
      const message = formatApiError(err, "Could not load gym");
      setDetailError(message);
      setDetail(null);
      toast.error(message);
    } finally {
      setDetailLoading(false);
    }
  }, [gymId, handleAuthError]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    setMemberPage(1);
  }, [debouncedMemberQ]);

  useEffect(() => {
    setStaffPage(1);
  }, [debouncedStaffQ]);

  const loadMembers = useCallback(async () => {
    if (
      joinedFrom &&
      joinedTo &&
      joinedFrom > joinedTo
    ) {
      toast.error("Joined from must be on or before joined to");
      return;
    }
    if (
      checkInFrom &&
      checkInTo &&
      checkInFrom > checkInTo
    ) {
      toast.error("Check-in from must be on or before check-in to");
      return;
    }

    setMembersLoading(true);
    try {
      const data = await fetchAdminGymMembers(gymId, {
        q: debouncedMemberQ.trim() || undefined,
        status: memberStatus || undefined,
        planId: memberPlanId || undefined,
        joinedFrom: joinedFrom || undefined,
        joinedTo: joinedTo || undefined,
        checkInFrom: checkInFrom || undefined,
        checkInTo: checkInTo || undefined,
        page: memberPage,
        pageSize: memberPageSize,
      });
      setMembers(data.members);
      setMemberPagination(data.pagination);
    } catch (err) {
      if (handleAuthError(err)) return;
      toast.error(formatApiError(err, "Could not load members"));
      setMembers([]);
      setMemberPagination(null);
    } finally {
      setMembersLoading(false);
    }
  }, [
    gymId,
    debouncedMemberQ,
    memberStatus,
    memberPlanId,
    joinedFrom,
    joinedTo,
    checkInFrom,
    checkInTo,
    memberPage,
    memberPageSize,
    handleAuthError,
  ]);

  const loadStaff = useCallback(async () => {
    if (
      staffJoinedFrom &&
      staffJoinedTo &&
      staffJoinedFrom > staffJoinedTo
    ) {
      toast.error("Joined from must be on or before joined to");
      return;
    }

    setStaffLoading(true);
    try {
      const data = await fetchAdminGymStaff(gymId, {
        q: debouncedStaffQ.trim() || undefined,
        status: staffStatus || undefined,
        role: staffRole || undefined,
        joinedFrom: staffJoinedFrom || undefined,
        joinedTo: staffJoinedTo || undefined,
        page: staffPage,
        pageSize: staffPageSize,
      });
      setStaff(data.staff);
      setStaffPagination(data.pagination);
    } catch (err) {
      if (handleAuthError(err)) return;
      toast.error(formatApiError(err, "Could not load staff"));
      setStaff([]);
      setStaffPagination(null);
    } finally {
      setStaffLoading(false);
    }
  }, [
    gymId,
    debouncedStaffQ,
    staffStatus,
    staffRole,
    staffJoinedFrom,
    staffJoinedTo,
    staffPage,
    staffPageSize,
    handleAuthError,
  ]);

  const loadMemberships = useCallback(async () => {
    setMembershipsLoading(true);
    try {
      const data = await fetchAdminGymMemberships(gymId);
      setMemberships(data.memberships);
      setMembershipsLoaded(true);
    } catch (err) {
      if (handleAuthError(err)) return;
      toast.error(formatApiError(err, "Could not load memberships"));
      setMemberships([]);
    } finally {
      setMembershipsLoading(false);
    }
  }, [gymId, handleAuthError]);

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const data = await fetchAdminGymActivity(gymId, {
        page: activityPage,
        pageSize: ACTIVITY_PAGE_SIZE,
      });
      setActivity(data.activity);
      setActivityPagination(data.pagination);
    } catch (err) {
      if (handleAuthError(err)) return;
      toast.error(formatApiError(err, "Could not load activity"));
      setActivity([]);
      setActivityPagination(null);
    } finally {
      setActivityLoading(false);
    }
  }, [gymId, activityPage, handleAuthError]);

  useEffect(() => {
    if (tab === "Members") void loadMembers();
  }, [tab, loadMembers]);

  useEffect(() => {
    if (tab === "Staff") void loadStaff();
  }, [tab, loadStaff]);

  useEffect(() => {
    if (tab === "Memberships" && !membershipsLoaded) void loadMemberships();
  }, [tab, membershipsLoaded, loadMemberships]);

  useEffect(() => {
    if (tab === "Activity") void loadActivity();
  }, [tab, loadActivity]);

  type MemberFilterKey =
    | "q"
    | "status"
    | "plan"
    | "joinedFrom"
    | "joinedTo"
    | "checkInFrom"
    | "checkInTo";

  function patchMemberFilter(key: MemberFilterKey, value: string) {
    if (key === "q") setMemberQ(value);
    if (key === "status") setMemberStatus(value);
    if (key === "plan") setMemberPlanId(value);
    if (key === "joinedFrom") setJoinedFrom(value);
    if (key === "joinedTo") setJoinedTo(value);
    if (key === "checkInFrom") setCheckInFrom(value);
    if (key === "checkInTo") setCheckInTo(value);
    setMemberPage(1);
  }

  function clearMemberFilters() {
    setMemberQ("");
    setMemberStatus("");
    setMemberPlanId("");
    setJoinedFrom("");
    setJoinedTo("");
    setCheckInFrom("");
    setCheckInTo("");
    setMemberPage(1);
  }

  const hasMemberFilters = Boolean(
    memberQ.trim() ||
      memberStatus ||
      memberPlanId ||
      joinedFrom ||
      joinedTo ||
      checkInFrom ||
      checkInTo,
  );

  function changeMemberPageSize(next: number) {
    setMemberPageSize(next);
    setMemberPage(1);
  }

  type StaffFilterKey = "q" | "status" | "role" | "joinedFrom" | "joinedTo";

  function patchStaffFilter(key: StaffFilterKey, value: string) {
    if (key === "q") setStaffQ(value);
    if (key === "status") setStaffStatus(value);
    if (key === "role") setStaffRole(value);
    if (key === "joinedFrom") setStaffJoinedFrom(value);
    if (key === "joinedTo") setStaffJoinedTo(value);
    setStaffPage(1);
  }

  function clearStaffFilters() {
    setStaffQ("");
    setStaffStatus("");
    setStaffRole("");
    setStaffJoinedFrom("");
    setStaffJoinedTo("");
    setStaffPage(1);
  }

  const hasStaffFilters = Boolean(
    staffQ.trim() ||
      staffStatus ||
      staffRole ||
      staffJoinedFrom ||
      staffJoinedTo,
  );

  function changeStaffPageSize(next: number) {
    setStaffPageSize(next);
    setStaffPage(1);
  }

  async function toggleSuspend() {
    if (!detail) return;
    const nextStatus: GymStatus =
      detail.gym.status === "suspended" ? "active" : "suspended";
    setStatusUpdating(true);
    try {
      const updated = await updateAdminGymStatus(gymId, nextStatus);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              gym: { ...prev.gym, ...updated, status: updated.status },
            }
          : prev,
      );
      toast.success(
        nextStatus === "suspended" ? "Gym suspended" : "Gym reinstated",
      );
    } catch (err) {
      if (handleAuthError(err)) return;
      toast.error(formatApiError(err, "Could not update gym status"));
    } finally {
      setStatusUpdating(false);
    }
  }

  const gym = detail?.gym;
  const owner = detail?.owner;
  const stats = detail?.stats;
  const billing = detail?.billing;
  const planOptions = detail?.membershipPlans ?? [];
  const recentActivity = detail?.recentActivity ?? [];

  const locationLine = useMemo(() => {
    if (!gym) return "—";
    const parts = [gym.city, gym.stateCode || gym.state].filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }, [gym]);

  const lastActivityAt = recentActivity[0]?.createdAt ?? null;
  const planTotal = memberships.reduce((sum, p) => sum + p.activeMembers, 0);

  const memberTotalPages = Math.max(1, memberPagination?.totalPages ?? 1);
  const safeMemberPage = Math.min(memberPage, memberTotalPages);
  const memberRangeStart =
    memberPagination && memberPagination.total > 0
      ? (memberPagination.page - 1) * memberPagination.pageSize + 1
      : 0;
  const memberRangeEnd = memberPagination
    ? Math.min(
        memberPagination.page * memberPagination.pageSize,
        memberPagination.total,
      )
    : 0;
  const memberPages = pageItems(safeMemberPage, memberTotalPages);

  const staffTotalPages = Math.max(1, staffPagination?.totalPages ?? 1);
  const safeStaffPage = Math.min(staffPage, staffTotalPages);
  const staffRangeStart =
    staffPagination && staffPagination.total > 0
      ? (staffPagination.page - 1) * staffPagination.pageSize + 1
      : 0;
  const staffRangeEnd = staffPagination
    ? Math.min(
        staffPagination.page * staffPagination.pageSize,
        staffPagination.total,
      )
    : 0;
  const staffPages = pageItems(safeStaffPage, staffTotalPages);

  const activityTotalPages = Math.max(1, activityPagination?.totalPages ?? 1);
  const activityPages = pageItems(activityPage, activityTotalPages);

  if (detailLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading gym…
      </div>
    );
  }

  if (detailError || !gym || !detail) {
    return (
      <div className="space-y-4">
        <Link
          to="/gyms"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-lime"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to gyms
        </Link>
        <EmptyState
          title="Gym not found"
          hint={detailError || "This gym may have been removed."}
          action={
            <Button size="sm" variant="secondary" onClick={() => void loadDetail()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const status = gym.status;

  return (
    <div className="space-y-6">
      <Link
        to="/gyms"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-lime"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to gyms
      </Link>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-panel ring-1 ring-white/[0.05] shadow-[0_18px_44px_-18px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col gap-5 border-b border-border/70 bg-gradient-to-br from-lime/[0.07] via-transparent to-transparent p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-lime text-xl font-bold text-lime-foreground shadow-[0_10px_28px_-10px_rgba(204,255,0,0.5)]">
              {initials(gym.name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="truncate text-2xl font-semibold tracking-tight">
                  {gym.name}
                </h1>
                <StatusBadge status={status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {locationLine}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Joined {formatDate(gym.joinedAt)}
                </span>
                {stats?.checkInsToday != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {stats.checkInsToday} check-ins today
                  </span>
                )}
                {lastActivityAt && (
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Active {formatDateTime(lastActivityAt)}
                  </span>
                )}
                <span className="rounded-full border border-border bg-panel-2 px-2 py-0.5 font-mono text-[11px]">
                  {gym.slug}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {status === "suspended" ? (
              <Button onClick={() => void toggleSuspend()} disabled={statusUpdating}>
                {statusUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Reinstate
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={() => void toggleSuspend()}
                disabled={statusUpdating || status === "inactive"}
              >
                {statusUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Suspend
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile
          label="Members"
          value={(stats?.members.total ?? 0).toLocaleString()}
          hint={`${stats?.members.active ?? 0} active now`}
          icon={Users}
          accent="text-foreground"
          iconWrap="bg-panel-2 text-muted-foreground border-border"
        />
        <StatTile
          label="Staff"
          value={(stats?.staffCount ?? 0).toLocaleString()}
          hint={`${stats?.trainerCount ?? 0} trainers`}
          icon={UserCog}
          accent="text-sky-300"
          iconWrap="bg-sky-500/10 text-sky-300 border-sky-500/25"
        />
        <StatTile
          label="Join requests"
          value={(stats?.joinRequestCount ?? 0).toLocaleString()}
          hint="Waiting on review"
          icon={Inbox}
          accent="text-amber-300"
          iconWrap="bg-amber-500/10 text-amber-300 border-amber-500/25"
        />
        <StatTile
          label="Monthly revenue"
          value={money(billing?.mrr)}
          hint={`${money(billing?.pending)} pending`}
          icon={Wallet}
          accent="text-lime"
          iconWrap="bg-lime/15 text-lime border-lime/25"
        />
      </div>

      <Tabs
        tabs={TABS}
        active={tab}
        onChange={(t) => setTab(t as DetailTab)}
      />

      {tab === "Overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel
              title="Contact & location"
              className="border-border/80 ring-1 ring-white/[0.04] shadow-[0_12px_32px_-16px_rgba(0,0,0,0.75)] lg:col-span-2"
            >
              <dl className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
                <Field label="Phone">
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {dash(gym.phone)}
                  </span>
                </Field>
                <Field label="Email">
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {dash(gym.email)}
                  </span>
                </Field>
                <Field label="Street" className="sm:col-span-2">
                  {dash(gym.address)}
                </Field>
                <Field label="City">
                  {[gym.city, gym.state].filter(Boolean).join(", ") || "—"}
                </Field>
                <Field label="Pincode">{dash(gym.pincode)}</Field>
              </dl>
            </Panel>

            <Panel
              title="Owner"
              className="border-border/80 ring-1 ring-white/[0.04] shadow-[0_12px_32px_-16px_rgba(0,0,0,0.75)]"
            >
              {owner ? (
                <div className="p-5">
                  <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime text-sm font-bold text-lime-foreground">
                      {initials(owner.fullName || "?")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {dash(owner.fullName)}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {dash(owner.email)}
                      </div>
                    </div>
                    <Badge tone="success">Owner</Badge>
                  </div>
                  <dl className="pt-1">
                    <DetailRow label="Phone">{dash(owner.phone)}</DetailRow>
                    <DetailRow label="Owner since">
                      {formatDate(owner.joinedAt)}
                    </DetailRow>
                    <DetailRow label="Last login">
                      {formatDateTime(owner.lastLoginAt)}
                    </DetailRow>
                  </dl>
                </div>
              ) : (
                <div className="p-5 text-sm text-muted-foreground">
                  No owner linked.
                </div>
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
            <Panel
              title="Recent activity"
              className="flex h-full flex-col border-border/80 ring-1 ring-white/[0.04] shadow-[0_12px_32px_-16px_rgba(0,0,0,0.75)] lg:col-span-2"
            >
              {recentActivity.length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
                  No recent activity.
                </div>
              ) : (
                <ul className="flex-1 divide-y divide-border/50">
                  {recentActivity.map((item) => {
                    const Icon = activityIcon(item.type);
                    return (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 px-5 py-3.5"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-panel-2 text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {item.message}
                          </div>
                          {activityDetail(item) ? (
                            <div className="truncate text-[11px] text-muted-foreground">
                              {activityDetail(item)}
                            </div>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-auto border-t border-border px-5 py-3">
                <button
                  type="button"
                  onClick={() => setTab("Activity")}
                  className="cursor-pointer text-xs font-medium text-lime transition-colors hover:text-lime/80"
                >
                  View all activity
                </button>
              </div>
            </Panel>

            <div className="flex h-full flex-col gap-4">
              <Panel
                title="Member breakdown"
                className="border-border/80 ring-1 ring-white/[0.04] shadow-[0_12px_32px_-16px_rgba(0,0,0,0.75)]"
              >
                <div className="space-y-4 p-5">
                  <DistributionBar
                    label="Active"
                    value={stats?.members.active ?? 0}
                    total={stats?.members.total ?? 0}
                    color="bg-lime"
                  />
                  <DistributionBar
                    label="Inactive"
                    value={stats?.members.inactive ?? 0}
                    total={stats?.members.total ?? 0}
                    color="bg-muted-foreground/60"
                  />
                  <DistributionBar
                    label="Suspended"
                    value={stats?.members.suspended ?? 0}
                    total={stats?.members.total ?? 0}
                    color="bg-red-400/70"
                  />
                </div>
              </Panel>

              <Panel
                title="Billing"
                className="flex-1 border-border/80 ring-1 ring-white/[0.04] shadow-[0_12px_32px_-16px_rgba(0,0,0,0.75)]"
              >
                <dl className="px-5 pb-4 pt-1">
                  <DetailRow label="Monthly revenue">
                    {money(billing?.mrr)}
                  </DetailRow>
                  <DetailRow label="Collected">
                    <span className="text-lime">
                      {money(billing?.collected)}
                    </span>
                  </DetailRow>
                  <DetailRow label="Pending">
                    <span className="text-amber-300">
                      {money(billing?.pending)}
                    </span>
                  </DetailRow>
                  <DetailRow label="Last payout">
                    {formatDate(billing?.lastPayoutAt ?? billing?.lastPaidAt)}
                  </DetailRow>
                </dl>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {tab === "Members" && (
        <Panel className="border-border/80 ring-1 ring-white/[0.05] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.85)]">
          <div className="space-y-4 border-b border-border px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={memberQ}
                  onChange={(e) => patchMemberFilter("q", e.target.value)}
                  placeholder="Search name, email, or phone"
                  className="w-full pl-9"
                />
              </div>
              <Select
                value={memberStatus}
                onChange={(e) => patchMemberFilter("status", e.target.value)}
                aria-label="Filter by status"
                className="w-full lg:w-40"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </Select>
              <Select
                value={memberPlanId}
                onChange={(e) => patchMemberFilter("plan", e.target.value)}
                aria-label="Filter by plan"
                className="w-full lg:w-44"
              >
                <option value="">All plans</option>
                {planOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Joined from
                </span>
                <Input
                  type="date"
                  value={joinedFrom}
                  onChange={(e) =>
                    patchMemberFilter("joinedFrom", e.target.value)
                  }
                  className="w-full"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Joined to
                </span>
                <Input
                  type="date"
                  value={joinedTo}
                  onChange={(e) =>
                    patchMemberFilter("joinedTo", e.target.value)
                  }
                  className="w-full"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Check-in from
                </span>
                <Input
                  type="date"
                  value={checkInFrom}
                  onChange={(e) =>
                    patchMemberFilter("checkInFrom", e.target.value)
                  }
                  className="w-full"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Check-in to
                </span>
                <Input
                  type="date"
                  value={checkInTo}
                  onChange={(e) =>
                    patchMemberFilter("checkInTo", e.target.value)
                  }
                  className="w-full"
                />
              </label>
            </div>

            {hasMemberFilters && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  Showing {memberPagination?.total ?? 0} match
                  {(memberPagination?.total ?? 0) === 1 ? "" : "es"}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={clearMemberFilters}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>

          {membersLoading ? (
            <LoadingBlock label="Loading members…" />
          ) : members.length === 0 ? (
            <EmptyState
              title="No members found"
              hint="Try clearing filters or broadening your search."
              action={
                hasMemberFilters ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={clearMemberFilters}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <Table
                head={[
                  "Member",
                  "Contact",
                  "Plan",
                  "Status",
                  "Joined",
                  "Last check-in",
                ]}
              >
                {members.map((m) => (
                  <Tr key={m.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-panel-2 text-[11px] font-semibold text-muted-foreground">
                          {initials(m.fullName || "?")}
                        </span>
                        <span className="font-medium">{dash(m.fullName)}</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="text-xs text-muted-foreground">
                        {dash(m.email)}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {dash(m.phone)}
                      </div>
                    </Td>
                    <Td className="text-muted-foreground">
                      {dash(m.membership?.planName)}
                    </Td>
                    <Td>
                      <StatusBadge status={m.status} />
                    </Td>
                    <Td className="text-xs text-muted-foreground">
                      {formatDate(m.joinedAt)}
                    </Td>
                    <Td className="text-xs text-muted-foreground">
                      {formatDate(m.lastCheckInAt)}
                    </Td>
                  </Tr>
                ))}
              </Table>

              <div className="flex flex-col gap-3 border-t border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="whitespace-nowrap">Rows per page</span>
                    <Select
                      value={String(memberPageSize)}
                      onChange={(e) =>
                        changeMemberPageSize(Number(e.target.value))
                      }
                      className="h-8 w-[4.5rem]"
                      aria-label="Rows per page"
                    >
                      {MEMBER_PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <div className="hidden h-4 w-px bg-border sm:block" />
                  <div className="text-xs tabular-nums text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {memberRangeStart}–{memberRangeEnd}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">
                      {memberPagination?.total ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={safeMemberPage <= 1}
                    onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </Button>

                  {memberTotalPages > 1 ? (
                    <div className="flex items-center gap-1">
                      {memberPages.map((item, idx) =>
                        item === "ellipsis" ? (
                          <span
                            key={`e-${idx}`}
                            className="px-1 text-xs text-muted-foreground"
                            aria-hidden
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setMemberPage(item)}
                            aria-label={`Page ${item}`}
                            aria-current={
                              item === safeMemberPage ? "page" : undefined
                            }
                            className={`inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md px-2 text-xs font-medium tabular-nums transition-colors ${
                              item === safeMemberPage
                                ? "bg-lime text-lime-foreground"
                                : "border border-border bg-panel-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                          >
                            {item}
                          </button>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="min-w-[5.5rem] text-center text-xs font-medium tabular-nums text-muted-foreground">
                      Page {safeMemberPage} of {memberTotalPages}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={safeMemberPage >= memberTotalPages}
                    onClick={() =>
                      setMemberPage((p) => Math.min(memberTotalPages, p + 1))
                    }
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Panel>
      )}

      {tab === "Staff" && (
        <Panel className="border-border/80 ring-1 ring-white/[0.05] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.85)]">
          <div className="space-y-4 border-b border-border px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={staffQ}
                  onChange={(e) => patchStaffFilter("q", e.target.value)}
                  placeholder="Search name, email, or role"
                  className="w-full pl-9"
                />
              </div>
              <Select
                value={staffStatus}
                onChange={(e) => patchStaffFilter("status", e.target.value)}
                aria-label="Filter by status"
                className="w-full lg:w-40"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </Select>
              <Select
                value={staffRole}
                onChange={(e) => patchStaffFilter("role", e.target.value)}
                aria-label="Filter by role"
                className="w-full lg:w-44"
              >
                <option value="">All roles</option>
                {STAFF_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Joined from
                </span>
                <Input
                  type="date"
                  value={staffJoinedFrom}
                  onChange={(e) =>
                    patchStaffFilter("joinedFrom", e.target.value)
                  }
                  className="w-full"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Joined to
                </span>
                <Input
                  type="date"
                  value={staffJoinedTo}
                  onChange={(e) =>
                    patchStaffFilter("joinedTo", e.target.value)
                  }
                  className="w-full"
                />
              </label>
            </div>

            {hasStaffFilters && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  Showing {staffPagination?.total ?? 0} match
                  {(staffPagination?.total ?? 0) === 1 ? "" : "es"}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={clearStaffFilters}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>

          {staffLoading ? (
            <LoadingBlock label="Loading staff…" />
          ) : staff.length === 0 ? (
            <EmptyState
              title="No staff found"
              hint="Try clearing filters or broadening your search."
              action={
                hasStaffFilters ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={clearStaffFilters}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <Table
                head={["Person", "Role", "Members", "Status", "Joined", "Last login"]}
              >
                {staff.map((s) => {
                  const roleName = s.role.name || s.role.slug || "—";
                  const isOwner = (s.role.slug || "").toLowerCase() === "owner";
                  return (
                    <Tr key={s.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-panel-2 text-[11px] font-semibold text-muted-foreground">
                            {initials(s.fullName || "?")}
                          </span>
                          <div>
                            <div className="font-medium">{dash(s.fullName)}</div>
                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                              {dash(s.email)}
                            </div>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <Badge tone={isOwner ? "success" : "info"}>
                          {roleName}
                        </Badge>
                      </Td>
                      <Td className="tabular-nums text-muted-foreground">
                        {s.membersAssigned || "—"}
                      </Td>
                      <Td>
                        <StatusBadge status={s.status} />
                      </Td>
                      <Td className="text-xs text-muted-foreground">
                        {formatDate(s.joinedAt)}
                      </Td>
                      <Td className="text-xs text-muted-foreground">
                        {formatDateTime(s.lastLoginAt)}
                      </Td>
                    </Tr>
                  );
                })}
              </Table>

              <div className="flex flex-col gap-3 border-t border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="whitespace-nowrap">Rows per page</span>
                    <Select
                      value={String(staffPageSize)}
                      onChange={(e) =>
                        changeStaffPageSize(Number(e.target.value))
                      }
                      className="h-8 w-[4.5rem]"
                      aria-label="Rows per page"
                    >
                      {STAFF_PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <div className="hidden h-4 w-px bg-border sm:block" />
                  <div className="text-xs tabular-nums text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {staffRangeStart}–{staffRangeEnd}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">
                      {staffPagination?.total ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={safeStaffPage <= 1}
                    onClick={() => setStaffPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </Button>

                  {staffTotalPages > 1 ? (
                    <div className="flex items-center gap-1">
                      {staffPages.map((item, idx) =>
                        item === "ellipsis" ? (
                          <span
                            key={`e-${idx}`}
                            className="px-1 text-xs text-muted-foreground"
                            aria-hidden
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setStaffPage(item)}
                            aria-label={`Page ${item}`}
                            aria-current={
                              item === safeStaffPage ? "page" : undefined
                            }
                            className={`inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md px-2 text-xs font-medium tabular-nums transition-colors ${
                              item === safeStaffPage
                                ? "bg-lime text-lime-foreground"
                                : "border border-border bg-panel-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                          >
                            {item}
                          </button>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="min-w-[5.5rem] text-center text-xs font-medium tabular-nums text-muted-foreground">
                      Page {safeStaffPage} of {staffTotalPages}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={safeStaffPage >= staffTotalPages}
                    onClick={() =>
                      setStaffPage((p) => Math.min(staffTotalPages, p + 1))
                    }
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Panel>
      )}

      {tab === "Memberships" && (
        <>
          {membershipsLoading ? (
            <LoadingBlock label="Loading memberships…" />
          ) : memberships.length === 0 ? (
            <EmptyState
              title="No membership plans"
              hint="This gym hasn’t published any plans yet."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {memberships.map((p) => {
                const pct = planTotal
                  ? Math.round((p.activeMembers / planTotal) * 100)
                  : 0;
                return (
                  <div
                    key={p.id}
                    className="flex flex-col rounded-xl border border-border/80 bg-panel p-5 ring-1 ring-white/[0.04] shadow-[0_12px_32px_-16px_rgba(0,0,0,0.75)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold">{p.name}</h3>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {dash(p.tagline)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-2xl font-semibold tabular-nums tracking-tight">
                          {money(p.basePrice)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {p.durationLabel}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-border/70 bg-panel-2/60 px-3 py-2.5">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Members
                        </div>
                        <div className="mt-1 text-sm font-semibold tabular-nums">
                          {p.activeMembers}
                          <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                            {pct}% share
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-panel-2/60 px-3 py-2.5">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Revenue
                        </div>
                        <div className="mt-1 text-sm font-semibold tabular-nums text-lime">
                          {money(p.revenue)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-panel-2/60 px-3 py-2.5">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Renewals
                        </div>
                        <div className="mt-1 text-sm font-semibold tabular-nums">
                          {p.renewals ?? "—"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-panel-2/60 px-3 py-2.5">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Created
                        </div>
                        <div className="mt-1 text-sm font-semibold">
                          {formatDate(p.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Member share</span>
                        <span className="tabular-nums">{pct}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel-2">
                        <div
                          className="h-full rounded-full bg-lime"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 border-t border-border/60 pt-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Includes
                      </div>
                      {p.benefits.length > 0 ? (
                        <ul className="mt-2 space-y-1.5">
                          {p.benefits.map((f) => (
                            <li
                              key={f}
                              className="flex items-center gap-2 text-xs text-foreground/90"
                            >
                              <span className="h-1 w-1 shrink-0 rounded-full bg-lime" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-2 text-xs text-muted-foreground">
                          No benefits listed.
                        </div>
                      )}
                      <div className="mt-3 text-[11px] text-muted-foreground">
                        {billingLabel(p)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "Activity" && (
        <Panel className="border-border/80 ring-1 ring-white/[0.05] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.85)]">
          {activityLoading ? (
            <LoadingBlock label="Loading activity…" />
          ) : activity.length === 0 ? (
            <EmptyState
              title="No activity yet"
              hint="Member events and notices for this gym will show up here."
            />
          ) : (
            <>
              <ul className="divide-y divide-border/50">
                {activity.map((item) => {
                  const Icon = activityIcon(item.type);
                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-panel-2/50"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-panel-2 text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {item.message}
                        </div>
                        {activityDetail(item) ? (
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {activityDetail(item)}
                          </div>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {activityTotalPages > 1 && (
                <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3.5">
                  <div className="text-xs tabular-nums text-muted-foreground">
                    Page {activityPage} of {activityTotalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={activityPage <= 1}
                      onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Prev
                    </Button>
                    <div className="flex items-center gap-1">
                      {activityPages.map((item, idx) =>
                        item === "ellipsis" ? (
                          <span
                            key={`ae-${idx}`}
                            className="px-1 text-xs text-muted-foreground"
                            aria-hidden
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setActivityPage(item)}
                            className={`inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md px-2 text-xs font-medium tabular-nums transition-colors ${
                              item === activityPage
                                ? "bg-lime text-lime-foreground"
                                : "border border-border bg-panel-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                          >
                            {item}
                          </button>
                        ),
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={activityPage >= activityTotalPages}
                      onClick={() =>
                        setActivityPage((p) =>
                          Math.min(activityTotalPages, p + 1),
                        )
                      }
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Panel>
      )}

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        Live platform-admin data for this gym.
      </div>
    </div>
  );
}
