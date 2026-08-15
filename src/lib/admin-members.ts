import { apiRequest } from "./api";
import { getAdminToken } from "./admin-auth";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

/** Display / filter status used by the members list. */
export type AdminMemberDisplayStatus = "active" | "inactive" | "suspended";

/** Account status controlled by PATCH .../status. */
export type AdminMemberAccountStatus = "active" | "suspended";

export type AdminMemberGymRef = {
  id?: string | null;
  name?: string | null;
  city?: string | null;
  memberLinkId?: string | null;
  memberCode?: string | null;
  status?: string | null;
  joinedAt?: string | null;
};

export type AdminMemberListItem = {
  id: string;
  fullName?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  memberCode?: string | null;
  avatarUrl?: string | null;
  /** Account or derived display status. */
  status: string;
  displayStatus?: string;
  gymId?: string | null;
  gymName?: string | null;
  gym?: string | AdminMemberGymRef | null;
  gyms?: AdminMemberGymRef[] | null;
  planId?: string | null;
  planName?: string | null;
  plan?: string | null;
  membership?: { planId?: string | null; planName?: string | null } | null;
  membershipStatus?: string | null;
  joinedAt?: string | null;
  joined?: string | null;
  lastCheckInAt?: string | null;
  lastCheckIn?: string | null;
  emailVerifiedAt?: string | null;
};

export type AdminMemberSummary = {
  total: number;
  active: number;
  inactive?: number;
  suspended: number;
};

export type ListAdminMembersQuery = {
  q?: string;
  status?: AdminMemberDisplayStatus;
  /** Gym name text filter. */
  gym?: string;
  /** Optional gym UUID if a lookup is available. */
  gymId?: string;
  /** Plan name text filter. */
  plan?: string;
  /** Optional plan UUID. */
  planId?: string;
  joinedFrom?: string;
  joinedTo?: string;
  page?: number;
  pageSize?: number;
};

export type AdminMemberProfile = {
  dob?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  fitnessLevel?: string | null;
  primaryGoal?: string | null;
};

export type AdminMemberAppSub = {
  status?: string | null;
  planName?: string | null;
  priceInr?: number | null;
  currency?: string | null;
  interval?: string | null;
  trialEndsAt?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean | null;
};

export type AdminMemberAppInvoice = {
  id: string;
  invoiceNumber?: string | null;
  amountInr?: number | null;
  status?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  paidAt?: string | null;
  dueAt?: string | null;
};

export type AdminMemberBilling = {
  collected?: number | null;
  pending?: number | null;
};

export type AdminMemberActivityItem = {
  id: string;
  type?: string | null;
  title?: string | null;
  message?: string | null;
  detail?: string | null;
  at?: string | null;
  createdAt?: string | null;
  occurredAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type AdminMemberMembership = {
  id: string;
  plan?: string | null;
  planName?: string | null;
  planId?: string | null;
  status?: string | null;
  start?: string | null;
  startDate?: string | null;
  end?: string | null;
  endDate?: string | null;
  price?: number | null;
  priceCharged?: number | null;
  discount?: string | { name?: string | null; amount?: number | null } | null;
  discountName?: string | null;
  discountAmount?: number | null;
  paymentMethod?: string | null;
  current?: boolean | null;
  gymId?: string | null;
  gymName?: string | null;
  notes?: string | null;
};

export type AdminMemberPayment = {
  id: string;
  amount?: number | null;
  status?: string | null;
  method?: string | null;
  forPlan?: string | null;
  planName?: string | null;
  paidAt?: string | null;
  dueAt?: string | null;
  createdAt?: string | null;
  gymId?: string | null;
  gymName?: string | null;
  notes?: string | null;
};

export type AdminMemberGoal = {
  id?: string | null;
  primaryGoal?: string | null;
  primary?: string | null;
  secondaryGoals?: string[] | null;
  status?: string | null;
  startWeightKg?: number | null;
  targetWeightKg?: number | null;
  currentWeightKg?: number | null;
  startDate?: string | null;
  timelineWeeks?: number | null;
  notes?: string | null;
};

export type AdminMemberWeightLog = {
  id: string;
  loggedOn?: string | null;
  weightKg?: number | null;
  source?: string | null;
  note?: string | null;
};

export type AdminMemberMeasurement = {
  id: string;
  loggedOn?: string | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  armsCm?: number | null;
  leftArmCm?: number | null;
  rightArmCm?: number | null;
};

export type AdminMemberPlanFollow = {
  id: string;
  name?: string | null;
  planName?: string | null;
  plan?: {
    name?: string | null;
    description?: string | null;
    level?: string | null;
    daysPerWeek?: number | null;
    kcal?: number | null;
    proteinG?: number | null;
  } | null;
  source?: string | null;
  status?: string | null;
  startsAt?: string | null;
  assignedAt?: string | null;
  endsAt?: string | null;
  endedAt?: string | null;
  daysPerWeek?: number | null;
  level?: string | null;
  kcal?: number | null;
  proteinG?: number | null;
  checkInsThisWeek?: number | null;
  assignedBy?: string | null;
  notes?: string | null;
  gymId?: string | null;
  gymName?: string | null;
};

export type AdminMemberNote = {
  id: string;
  author?: string | null;
  createdBy?: string | null;
  body?: string | null;
  at?: string | null;
  createdAt?: string | null;
};

/**
 * Overview bundle for GET /members/:id.
 * Fields mirror the ops UI; extras from the server are optional.
 */
export type AdminMemberDetail = {
  id: string;
  fullName?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  memberCode?: string | null;
  accountStatus?: AdminMemberAccountStatus | string | null;
  status?: string | null;
  gymLinkStatus?: string | null;
  gym?: string | AdminMemberGymRef | null;
  gyms?: AdminMemberGymRef[] | null;
  gymName?: string | null;
  gymCity?: string | null;
  plan?: string | null;
  planName?: string | null;
  joinedAt?: string | null;
  joined?: string | null;
  joinedVia?: string | null;
  appLinkedAt?: string | null;
  lastCheckInAt?: string | null;
  lastCheckIn?: string | null;
  emailVerified?: boolean | null;
  emailVerifiedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  profile?: AdminMemberProfile | null;
  appSub?: AdminMemberAppSub | null;
  subscription?: AdminMemberAppSub | null;
  appInvoices?: AdminMemberAppInvoice[] | null;
  billing?: AdminMemberBilling | null;
  recentActivity?: AdminMemberActivityItem[] | null;
  activity?: AdminMemberActivityItem[] | null;
  currentMembership?: AdminMemberMembership | null;
  memberships?: AdminMemberMembership[] | null;
};

export type AdminMemberOverview = {
  member: AdminMemberDetail;
  primaryGym: AdminMemberGymRef | null;
  gymMember?: AdminMemberDetail | null;
  gyms: AdminMemberGymRef[];
};

export type AdminMemberProgressData = {
  goal?: AdminMemberGoal | null;
  campaign?: AdminMemberGoal | null;
  weights?: AdminMemberWeightLog[] | null;
  weightLogs?: AdminMemberWeightLog[] | null;
  measurements?: AdminMemberMeasurement[] | null;
  currentWeightKg?: number | null;
  outcome?: {
    startKg?: number | null;
    currentKg?: number | null;
    targetKg?: number | null;
  } | null;
};

export type AdminMemberAppPlanData = {
  subscription?: AdminMemberAppSub | null;
  appSub?: AdminMemberAppSub | null;
  invoices?: AdminMemberAppInvoice[] | null;
  appInvoices?: AdminMemberAppInvoice[] | null;
};

function tokenOrThrow() {
  const token = getAdminToken();
  if (!token) throw new Error("Not signed in");
  return token;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

export function memberDisplayName(
  m: Pick<AdminMemberListItem, "fullName" | "name"> | null | undefined,
): string {
  if (!m) return "—";
  return asString(m.fullName) || asString(m.name) || "—";
}

export function memberGymName(
  m:
    | Pick<AdminMemberListItem, "gym" | "gymName" | "gyms">
    | Pick<AdminMemberDetail, "gym" | "gymName" | "gyms">
    | null
    | undefined,
): string {
  if (!m) return "—";
  if (typeof m.gym === "string" && m.gym.trim()) return m.gym;
  const gymObj = asRecord(m.gym);
  if (gymObj) {
    const nested = asString(gymObj.name);
    if (nested) return nested;
  }
  if (asString(m.gymName)) return m.gymName as string;
  const first = Array.isArray(m.gyms) ? m.gyms[0] : null;
  if (first && asString(first.name)) return first.name as string;
  return "—";
}

export function memberGymCity(
  m: Pick<AdminMemberDetail, "gym" | "gymCity" | "gyms"> | null | undefined,
): string {
  if (!m) return "—";
  if (asString(m.gymCity)) return m.gymCity as string;
  const gymObj = asRecord(m.gym);
  if (gymObj && asString(gymObj.city)) return gymObj.city as string;
  const first = Array.isArray(m.gyms) ? m.gyms[0] : null;
  if (first && asString(first.city)) return first.city as string;
  return "—";
}

export function memberPlanName(
  m:
    | Pick<AdminMemberListItem, "plan" | "planName" | "membership">
    | Pick<AdminMemberDetail, "plan" | "planName" | "currentMembership">
    | null
    | undefined,
): string {
  if (!m) return "—";
  if (asString(m.planName)) return m.planName as string;
  if (asString(m.plan)) return m.plan as string;
  const membership = asRecord(
    "membership" in m ? m.membership : "currentMembership" in m ? m.currentMembership : null,
  );
  if (membership) {
    return asString(membership.planName) || asString(membership.plan) || "—";
  }
  return "—";
}

export function memberJoinedAt(
  m: Pick<AdminMemberListItem, "joinedAt" | "joined"> | null | undefined,
): string | null {
  if (!m) return null;
  return asString(m.joinedAt) || asString(m.joined);
}

export function memberLastCheckIn(
  m: Pick<AdminMemberListItem, "lastCheckInAt" | "lastCheckIn"> | null | undefined,
): string | null {
  if (!m) return null;
  return asString(m.lastCheckInAt) || asString(m.lastCheckIn);
}

export function memberListStatus(m: AdminMemberListItem | null | undefined): string {
  if (!m) return "inactive";
  return asString(m.displayStatus) || asString(m.status) || "inactive";
}

export function memberAccountStatus(
  detail: AdminMemberDetail | null | undefined,
): AdminMemberAccountStatus {
  const raw = asString(detail?.accountStatus) || asString(detail?.status) || "active";
  return raw === "suspended" ? "suspended" : "active";
}

export function memberGymLinkStatus(detail: AdminMemberDetail | null | undefined): string {
  if (!detail) return "active";
  if (asString(detail.gymLinkStatus)) return detail.gymLinkStatus as string;
  const gymObj = asRecord(detail.gym);
  if (gymObj && asString(gymObj.status)) return gymObj.status as string;
  const first = Array.isArray(detail.gyms) ? detail.gyms[0] : null;
  if (first && asString(first.status)) return first.status as string;
  return "active";
}

export function memberMemberCode(detail: AdminMemberDetail | null | undefined): string {
  if (!detail) return "—";
  if (asString(detail.memberCode)) return detail.memberCode as string;
  const first = Array.isArray(detail.gyms) ? detail.gyms[0] : null;
  if (first && asString(first.memberCode)) return first.memberCode as string;
  return "—";
}

export function membershipPlanLabel(m: AdminMemberMembership): string {
  return asString(m.planName) || asString(m.plan) || "—";
}

export function membershipStart(m: AdminMemberMembership): string | null {
  return asString(m.startDate) || asString(m.start);
}

export function membershipEnd(m: AdminMemberMembership): string | null {
  return asString(m.endDate) || asString(m.end);
}

export function membershipPrice(m: AdminMemberMembership): number {
  return asNumber(m.priceCharged) ?? asNumber(m.price) ?? 0;
}

export function membershipDiscountLabel(m: AdminMemberMembership): string | null {
  if (typeof m.discount === "string") return m.discount;
  if (m.discount && typeof m.discount === "object") {
    const name = asString(m.discount.name);
    const amount = asNumber(m.discount.amount);
    if (name && amount != null) return `${name} (−₹${amount.toLocaleString("en-IN")})`;
    if (name) return name;
  }
  return asString(m.discountName);
}

export function paymentPlanLabel(p: AdminMemberPayment): string {
  return asString(p.forPlan) || asString(p.planName) || "—";
}

export function activityTitle(item: AdminMemberActivityItem): string {
  return asString(item.title) || asString(item.message) || "Activity";
}

export function activityDetail(item: AdminMemberActivityItem): string {
  if (asString(item.detail)) return item.detail as string;
  const meta = item.metadata;
  if (meta && typeof meta === "object") {
    const planName = asString(meta.planName);
    if (planName) return planName;
  }
  return "";
}

export function activityAt(item: AdminMemberActivityItem): string | null {
  return asString(item.at) || asString(item.occurredAt) || asString(item.createdAt);
}

export function noteAuthor(note: AdminMemberNote): string {
  return asString(note.author) || asString(note.createdBy) || "Staff";
}

export function noteAt(note: AdminMemberNote): string | null {
  return asString(note.at) || asString(note.createdAt);
}

export function planFollowName(p: AdminMemberPlanFollow): string {
  return asString(p.name) || asString(p.planName) || asString(p.plan?.name) || "—";
}

export function planFollowStartsAt(p: AdminMemberPlanFollow): string | null {
  return asString(p.startsAt) || asString(p.assignedAt);
}

export function planFollowEndsAt(p: AdminMemberPlanFollow): string | null {
  return asString(p.endsAt) || asString(p.endedAt);
}

export function measurementArmsCm(m: AdminMemberMeasurement): number | null {
  const arms = asNumber(m.armsCm);
  if (arms != null) return arms;
  const left = asNumber(m.leftArmCm);
  const right = asNumber(m.rightArmCm);
  if (left != null && right != null) return Math.round(((left + right) / 2) * 10) / 10;
  return left ?? right;
}

export function resolveAppSub(
  detail: AdminMemberDetail | null | undefined,
  appPlan?: AdminMemberAppPlanData | null,
): AdminMemberAppSub | null {
  return appPlan?.appSub || appPlan?.subscription || detail?.appSub || detail?.subscription || null;
}

export function resolveAppInvoices(
  detail: AdminMemberDetail | null | undefined,
  appPlan?: AdminMemberAppPlanData | null,
): AdminMemberAppInvoice[] {
  return appPlan?.appInvoices || appPlan?.invoices || detail?.appInvoices || [];
}

export function resolveGoal(
  progress: AdminMemberProgressData | null | undefined,
): AdminMemberGoal | null {
  if (!progress) return null;
  const goal = progress.goal || progress.campaign || null;
  if (!goal) return null;
  const current =
    asNumber(goal.currentWeightKg) ??
    asNumber(progress.currentWeightKg) ??
    asNumber(progress.outcome?.currentKg);
  return {
    ...goal,
    primaryGoal: asString(goal.primaryGoal) || asString(goal.primary) || null,
    currentWeightKg: current,
    startWeightKg: asNumber(goal.startWeightKg) ?? asNumber(progress.outcome?.startKg),
    targetWeightKg: asNumber(goal.targetWeightKg) ?? asNumber(progress.outcome?.targetKg),
  };
}

export async function fetchAdminMembers(query: ListAdminMembersQuery = {}) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.gym) params.set("gym", query.gym);
  if (query.gymId) params.set("gymId", query.gymId);
  if (query.plan) params.set("plan", query.plan);
  if (query.planId) params.set("planId", query.planId);
  if (query.joinedFrom) params.set("joinedFrom", query.joinedFrom);
  if (query.joinedTo) params.set("joinedTo", query.joinedTo);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));

  const result = await apiRequest<
    ApiSuccess<{
      members: AdminMemberListItem[];
      pagination: PaginationMeta;
      summary: AdminMemberSummary;
    }>
  >(`/api/platform-admin/members?${params}`, {
    method: "GET",
    token: tokenOrThrow(),
  });
  return result.data;
}

export async function fetchAdminMemberDetail(memberId: string) {
  const result = await apiRequest<ApiSuccess<AdminMemberOverview>>(
    `/api/platform-admin/members/${memberId}`,
    {
      method: "GET",
      token: tokenOrThrow(),
    },
  );
  return result.data;
}

export async function fetchAdminMemberMemberships(memberId: string) {
  const result = await apiRequest<ApiSuccess<{ memberships: AdminMemberMembership[] }>>(
    `/api/platform-admin/members/${memberId}/memberships`,
    {
      method: "GET",
      token: tokenOrThrow(),
    },
  );
  return result.data;
}

export async function fetchAdminMemberPayments(memberId: string) {
  const result = await apiRequest<ApiSuccess<{ payments: AdminMemberPayment[] }>>(
    `/api/platform-admin/members/${memberId}/payments`,
    {
      method: "GET",
      token: tokenOrThrow(),
    },
  );
  return result.data;
}

export async function fetchAdminMemberAppPlan(memberId: string) {
  const result = await apiRequest<ApiSuccess<AdminMemberAppPlanData>>(
    `/api/platform-admin/members/${memberId}/app-plan`,
    {
      method: "GET",
      token: tokenOrThrow(),
    },
  );
  return result.data;
}

export async function fetchAdminMemberProgress(
  memberId: string,
  query: { from?: string; to?: string } = {},
) {
  const params = new URLSearchParams();
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  const qs = params.toString();
  const result = await apiRequest<ApiSuccess<AdminMemberProgressData>>(
    `/api/platform-admin/members/${memberId}/progress${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      token: tokenOrThrow(),
    },
  );
  return result.data;
}

export async function fetchAdminMemberWorkouts(memberId: string) {
  const result = await apiRequest<
    ApiSuccess<{
      primaryGym: AdminMemberGymRef | null;
      assignment?: AdminMemberPlanFollow | null;
    }>
  >(`/api/platform-admin/members/${memberId}/workouts`, {
    method: "GET",
    token: tokenOrThrow(),
  });
  return result.data;
}

export async function fetchAdminMemberDiets(memberId: string) {
  const result = await apiRequest<
    ApiSuccess<{
      primaryGym: AdminMemberGymRef | null;
      assignment?: AdminMemberPlanFollow | null;
    }>
  >(`/api/platform-admin/members/${memberId}/diets`, {
    method: "GET",
    token: tokenOrThrow(),
  });
  return result.data;
}

export async function fetchAdminMemberActivity(
  memberId: string,
  query: { page?: number; pageSize?: number } = {},
) {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.pageSize != null) params.set("pageSize", String(query.pageSize));
  const qs = params.toString();
  const result = await apiRequest<
    ApiSuccess<{
      activities?: AdminMemberActivityItem[];
      activity?: AdminMemberActivityItem[];
      pagination?: PaginationMeta;
    }>
  >(`/api/platform-admin/members/${memberId}/activity${qs ? `?${qs}` : ""}`, {
    method: "GET",
    token: tokenOrThrow(),
  });
  return result.data;
}

export async function fetchAdminMemberNotes(memberId: string) {
  const result = await apiRequest<
    ApiSuccess<{
      notes: AdminMemberNote[];
      pagination?: PaginationMeta;
      primaryGym?: AdminMemberGymRef | null;
    }>
  >(`/api/platform-admin/members/${memberId}/notes`, {
    method: "GET",
    token: tokenOrThrow(),
  });
  return result.data;
}

export async function updateAdminMemberStatus(memberId: string, status: AdminMemberAccountStatus) {
  const result = await apiRequest<
    ApiSuccess<
      | AdminMemberDetail
      | { member: AdminMemberDetail }
      | { id: string; status: AdminMemberAccountStatus }
    >
  >(`/api/platform-admin/members/${memberId}/status`, {
    method: "PATCH",
    token: tokenOrThrow(),
    body: { status },
  });
  return result.data;
}
