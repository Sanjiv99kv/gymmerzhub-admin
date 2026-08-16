import { apiRequest } from "./api";
import { getAdminToken } from "./admin-auth";
import type { PaginationMeta } from "./admin-gyms";

type ApiSuccess<T> = { success: true; message: string; data: T };
export type JoinRequestStatus = "pending" | "approved" | "rejected" | "cancelled";
export type JoinRequestSearchField = "gymId" | "memberId" | "memberEmail" | "ownerEmail";

export const JOIN_REQUEST_SEARCH_FIELDS: Array<{
  value: JoinRequestSearchField;
  label: string;
  placeholder: string;
}> = [
  { value: "memberEmail", label: "Member email", placeholder: "Search by member email…" },
  { value: "ownerEmail", label: "Gym owner email", placeholder: "Search by owner email…" },
  { value: "memberId", label: "Member ID", placeholder: "Paste member UUID…" },
  { value: "gymId", label: "Gym ID", placeholder: "Paste gym UUID…" },
];

export type AdminJoinRequest = {
  id: string;
  status: JoinRequestStatus;
  message: string | null;
  rejectionReason: string | null;
  createdAt: string | null;
  reviewedAt: string | null;
  member: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  } | null;
  gym: { id: string; name: string; city: string | null; status: string } | null;
  suggestedPlan: { id: string; name: string } | null;
};

export type AdminJoinRequestSummary = Record<JoinRequestStatus | "total", number>;

export type ListAdminJoinRequestsQuery = {
  q?: string;
  searchField?: JoinRequestSearchField;
  status?: JoinRequestStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

function tokenOrThrow() {
  const token = getAdminToken();
  if (!token) throw new Error("Not signed in");
  return token;
}

export async function fetchAdminJoinRequests(query: ListAdminJoinRequestsQuery = {}) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.searchField) params.set("searchField", query.searchField);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));
  const result = await apiRequest<
    ApiSuccess<{ requests: AdminJoinRequest[]; pagination: PaginationMeta }>
  >(`/api/platform-admin/join-requests?${params}`, {
    token: tokenOrThrow(),
  });
  return result.data;
}

export async function fetchAdminJoinRequestSummary() {
  const result = await apiRequest<ApiSuccess<{ summary: AdminJoinRequestSummary }>>(
    "/api/platform-admin/join-requests/summary",
    { token: tokenOrThrow() },
  );
  return result.data.summary;
}
