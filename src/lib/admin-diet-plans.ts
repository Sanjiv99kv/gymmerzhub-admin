import { apiRequest } from "./api";
import { getAdminToken } from "./admin-auth";
import type { PaginationMeta } from "./admin-gyms";

type ApiSuccess<T> = { success: true; message: string; data: T };
export type DietVisibility = "draft" | "published";
export type DietStatus = "active" | "inactive";

/** Matches backend MEMBER_PRIMARY_GOALS — used for catalog matching. */
export const DIET_PLAN_GOALS = [
  "stay_fit",
  "lose_weight",
  "gain_muscle",
  "improve_strength",
  "improve_endurance",
  "mobility",
] as const;
export type DietPlanGoal = (typeof DIET_PLAN_GOALS)[number];

export const DIET_PLAN_GOAL_LABELS: Record<DietPlanGoal, string> = {
  stay_fit: "Stay fit",
  lose_weight: "Lose weight",
  gain_muscle: "Gain muscle",
  improve_strength: "Improve strength",
  improve_endurance: "Improve endurance",
  mobility: "Mobility",
};

/** Matches backend DIET_PLAN_TAGS. */
export const DIET_PLAN_TAGS = ["cut", "bulk", "maintain", "plant_based"] as const;
export type DietPlanTag = (typeof DIET_PLAN_TAGS)[number];

export const DIET_PLAN_TAG_LABELS: Record<DietPlanTag, string> = {
  cut: "Cut",
  bulk: "Bulk",
  maintain: "Maintain",
  plant_based: "Plant-based",
};

export function dietGoalLabel(goal: string | null | undefined) {
  if (!goal) return "";
  return DIET_PLAN_GOAL_LABELS[goal as DietPlanGoal] ?? goal;
}

export function dietTagLabel(tag: string | null | undefined) {
  if (!tag) return "";
  return DIET_PLAN_TAG_LABELS[tag as DietPlanTag] ?? tag;
}

export type DietPlanSummary = {
  id: string;
  name: string;
  tag: string;
  goal: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  notes: string;
  visibility: DietVisibility;
  status: DietStatus;
  memberCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};
export type DietPlanItem = {
  id: string;
  foodItemId: string;
  quantity: number;
  notes: string | null;
  name: string;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
export type DietPlanSlot = {
  id: string;
  name: string;
  timeHint: string;
  sortOrder: number;
  targets: { protein: number; carbs: number; fat: number; cal: number };
  options: Array<{ id: string; isDefault: boolean; sortOrder: number; items: DietPlanItem[] }>;
};
export type DietPlanDetail = DietPlanSummary & {
  days: Array<{ dayIndex: number; day?: string; slots: DietPlanSlot[] }>;
};
export type CreateDietPlan = {
  name: string;
  tag?: DietPlanTag | null;
  goal?: DietPlanGoal | null;
  water?: number;
  notes?: string | null;
  status: DietStatus;
  visibility: DietVisibility;
  days: Array<{
    dayIndex: number;
    slots: Array<{
      name: string;
      timeHint?: string | null;
      options: Array<{
        items: Array<{ foodItemId: string; quantity: number; notes?: string | null }>;
      }>;
    }>;
  }>;
};

export type UpdateDietPlan = Partial<Omit<CreateDietPlan, "days">> & {
  days?: CreateDietPlan["days"];
};

export type AdminDietPlanSummary = {
  total: number;
  published: number;
  draft: number;
  active: number;
  avgCalories: number;
};

function token() {
  const value = getAdminToken();
  if (!value) throw new Error("Not signed in");
  return value;
}

export async function fetchAdminDietPlans(
  query: {
    q?: string;
    status?: DietStatus;
    visibility?: DietVisibility;
    page?: number;
    pageSize?: number;
  } = {},
) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.visibility) params.set("visibility", query.visibility);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));
  const result = await apiRequest<
    ApiSuccess<{ plans: DietPlanSummary[]; pagination: PaginationMeta }>
  >(`/api/platform-admin/diet-plans?${params}`, { token: token() });
  return result.data;
}

export async function fetchAdminDietPlanSummary() {
  const result = await apiRequest<ApiSuccess<{ summary: AdminDietPlanSummary }>>(
    "/api/platform-admin/diet-plans/summary",
    { token: token() },
  );
  return result.data.summary;
}

export async function fetchAdminDietPlan(id: string) {
  const result = await apiRequest<ApiSuccess<{ plan: DietPlanDetail }>>(
    `/api/platform-admin/diet-plans/${id}`,
    { token: token() },
  );
  return result.data.plan;
}

export async function createAdminDietPlan(body: CreateDietPlan) {
  const result = await apiRequest<ApiSuccess<{ plan: DietPlanDetail }>>(
    "/api/platform-admin/diet-plans",
    { method: "POST", token: token(), body },
  );
  return result.data.plan;
}

export async function updateAdminDietPlan(planId: string, body: UpdateDietPlan) {
  const result = await apiRequest<ApiSuccess<{ plan: DietPlanDetail }>>(
    `/api/platform-admin/diet-plans/${planId}`,
    { method: "PATCH", token: token(), body },
  );
  return result.data.plan;
}

export type PlanMemberKind = "follow" | "assignment";
export type PlanMemberStatus = "active" | "ended" | "expired" | string;

export type PlanMember = {
  id: string;
  kind: PlanMemberKind;
  source: string;
  status: PlanMemberStatus;
  accountId: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  gymId: string | null;
  gymName: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string | null;
};

export async function fetchAdminDietPlanMembers(
  planId: string,
  query: {
    q?: string;
    status?: "active" | "ended" | "expired" | "all";
    kind?: "follow" | "assignment" | "all";
    page?: number;
    pageSize?: number;
  } = {},
) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.kind) params.set("kind", query.kind);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));
  const result = await apiRequest<
    ApiSuccess<{ members: PlanMember[]; pagination: PaginationMeta }>
  >(`/api/platform-admin/diet-plans/${planId}/members?${params}`, { token: token() });
  return result.data;
}
