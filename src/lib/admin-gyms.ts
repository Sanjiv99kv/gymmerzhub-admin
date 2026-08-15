import { apiRequest } from "./api";
import { getAdminToken } from "./admin-auth";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type AdminGymOwner = {
  id: string;
  fullName: string;
  email: string;
} | null;

export type AdminGym = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  stateCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  pincode: string | null;
  status: "active" | "suspended" | "inactive";
  memberCount: number;
  activeMemberCount: number;
  owner: AdminGymOwner;
  joinedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminGymDetailOwner = {
  id: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  joinedAt: string | null;
  lastLoginAt: string | null;
} | null;

export type AdminGymMemberBreakdown = {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
};

export type AdminGymBilling = {
  collected: number;
  pending: number;
  lastPaidAt: string | null;
  lastPayoutAt: string | null;
  mrr: number | null;
};

export type AdminGymActivityItem = {
  id: string;
  type: string;
  message: string;
  metadata: Record<string, unknown>;
  memberName: string | null;
  createdAt: string | null;
};

export type AdminGymPlanSummary = {
  id: string;
  name: string;
  status: string;
  durationValue: number;
  durationUnit: string;
  durationLabel: string;
  basePrice: number;
  activeMembers: number;
  soldCount: number;
  revenue: number;
};

export type AdminGymDetail = {
  gym: AdminGym;
  owner: AdminGymDetailOwner;
  stats: {
    members: AdminGymMemberBreakdown;
    staffCount: number;
    activeStaffCount: number;
    trainerCount: number;
    joinRequestCount: number;
    membershipPlanCount: number;
    checkInsToday: number | null;
  };
  billing: AdminGymBilling;
  membershipPlans: AdminGymPlanSummary[];
  recentActivity: AdminGymActivityItem[];
};

export type AdminGymMember = {
  id: string;
  memberCode: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: string;
  joinedAt: string | null;
  membership: { planId: string; planName: string | null } | null;
  lastCheckInAt: string | null;
};

export type AdminGymStaff = {
  id: string;
  accountId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: { slug: string | null; name: string | null };
  status: string;
  joinedAt: string | null;
  lastLoginAt: string | null;
  membersAssigned: number;
};

export type AdminGymMembershipPlan = {
  id: string;
  name: string;
  durationValue: number;
  durationUnit: string;
  durationLabel: string;
  basePrice: number;
  registrationFee: number;
  gstPercent: number;
  tagline: string | null;
  benefits: string[];
  status: string;
  displayOrder: number;
  highlight: boolean;
  badge: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  soldCount: number;
  activeMembers: number;
  revenue: number;
  renewals: number | null;
};

export type ListAdminGymMembersQuery = {
  q?: string;
  status?: string;
  planId?: string;
  joinedFrom?: string;
  joinedTo?: string;
  checkInFrom?: string;
  checkInTo?: string;
  page?: number;
  pageSize?: number;
};

export type ListAdminGymStaffQuery = {
  q?: string;
  status?: string;
  role?: string;
  joinedFrom?: string;
  joinedTo?: string;
  page?: number;
  pageSize?: number;
};

export type ListAdminGymActivityQuery = {
  page?: number;
  pageSize?: number;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type AdminGymSummary = {
  total: number;
  active: number;
  suspended: number;
  inactive: number;
};

export type ListAdminGymsQuery = {
  q?: string;
  status?: "active" | "suspended" | "inactive";
  city?: string;
  state?: string;
  joinedFrom?: string;
  joinedTo?: string;
  page?: number;
  pageSize?: number;
};

function tokenOrThrow() {
  const token = getAdminToken();
  if (!token) throw new Error("Not signed in");
  return token;
}

export async function fetchAdminGyms(query: ListAdminGymsQuery = {}) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.city) params.set("city", query.city);
  if (query.state) params.set("state", query.state);
  if (query.joinedFrom) params.set("joinedFrom", query.joinedFrom);
  if (query.joinedTo) params.set("joinedTo", query.joinedTo);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));

  const qs = params.toString();
  const result = await apiRequest<
    ApiSuccess<{
      gyms: AdminGym[];
      pagination: PaginationMeta;
      summary: AdminGymSummary;
    }>
  >(`/api/platform-admin/gyms?${qs}`, {
    method: "GET",
    token: tokenOrThrow(),
  });
  return result.data;
}

export async function fetchAdminGymDetail(gymId: string) {
  const result = await apiRequest<ApiSuccess<AdminGymDetail>>(
    `/api/platform-admin/gyms/${gymId}`,
    {
      method: "GET",
      token: tokenOrThrow(),
    },
  );
  return result.data;
}

export async function fetchAdminGymMembers(
  gymId: string,
  query: ListAdminGymMembersQuery = {},
) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.planId) params.set("planId", query.planId);
  if (query.joinedFrom) params.set("joinedFrom", query.joinedFrom);
  if (query.joinedTo) params.set("joinedTo", query.joinedTo);
  if (query.checkInFrom) params.set("checkInFrom", query.checkInFrom);
  if (query.checkInTo) params.set("checkInTo", query.checkInTo);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));

  const result = await apiRequest<
    ApiSuccess<{ members: AdminGymMember[]; pagination: PaginationMeta }>
  >(`/api/platform-admin/gyms/${gymId}/members?${params}`, {
    method: "GET",
    token: tokenOrThrow(),
  });
  return result.data;
}

export async function fetchAdminGymStaff(
  gymId: string,
  query: ListAdminGymStaffQuery = {},
) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.role) params.set("role", query.role);
  if (query.joinedFrom) params.set("joinedFrom", query.joinedFrom);
  if (query.joinedTo) params.set("joinedTo", query.joinedTo);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));

  const result = await apiRequest<
    ApiSuccess<{ staff: AdminGymStaff[]; pagination: PaginationMeta }>
  >(`/api/platform-admin/gyms/${gymId}/staff?${params}`, {
    method: "GET",
    token: tokenOrThrow(),
  });
  return result.data;
}

export async function fetchAdminGymMemberships(
  gymId: string,
  status?: string,
) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const qs = params.toString();
  const result = await apiRequest<
    ApiSuccess<{ memberships: AdminGymMembershipPlan[] }>
  >(`/api/platform-admin/gyms/${gymId}/memberships${qs ? `?${qs}` : ""}`, {
    method: "GET",
    token: tokenOrThrow(),
  });
  return result.data;
}

export async function fetchAdminGymActivity(
  gymId: string,
  query: ListAdminGymActivityQuery = {},
) {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));

  const result = await apiRequest<
    ApiSuccess<{ activity: AdminGymActivityItem[]; pagination: PaginationMeta }>
  >(`/api/platform-admin/gyms/${gymId}/activity?${params}`, {
    method: "GET",
    token: tokenOrThrow(),
  });
  return result.data;
}

export async function updateAdminGymStatus(
  gymId: string,
  status: "active" | "suspended" | "inactive",
) {
  const result = await apiRequest<ApiSuccess<AdminGym>>(
    `/api/platform-admin/gyms/${gymId}/status`,
    {
      method: "PATCH",
      token: tokenOrThrow(),
      body: { status },
    },
  );
  return result.data;
}
