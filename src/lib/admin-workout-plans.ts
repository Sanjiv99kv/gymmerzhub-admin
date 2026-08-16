import { apiRequest } from "./api";
import { getAdminToken } from "./admin-auth";
import type { PaginationMeta } from "./admin-gyms";

type ApiSuccess<T> = { success: true; message: string; data: T };
export type WorkoutVisibility = "draft" | "published";
export type WorkoutStatus = "active" | "inactive";

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string | null;
  restSeconds: number | null;
  note: string | null;
  sortOrder: number;
  name: string;
  muscleGroup: string;
  equipment: string;
  level: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  imageUrls: string[];
  videoUrls: string[];
};
export type WorkoutDay = {
  id: string;
  name: string;
  focus: string | null;
  sortOrder: number;
  exercises: WorkoutExercise[];
};
export type WorkoutPlan = {
  id: string;
  name: string;
  level: string | null;
  focus: string | null;
  goal: string | null;
  duration: string | null;
  daysPerWeek: number;
  description: string | null;
  notes: string | null;
  status: WorkoutStatus;
  visibility: WorkoutVisibility;
  memberCount: number;
  days: WorkoutDay[];
  createdAt: string | null;
  updatedAt: string | null;
};
export type WorkoutExerciseInput = {
  exerciseId: string;
  sets?: number;
  reps?: string | null;
  restSeconds?: number | null;
  note?: string | null;
};
export type WorkoutPlanInput = {
  name: string;
  level?: string | null;
  focus?: string | null;
  goal?: string | null;
  duration?: string | null;
  daysPerWeek?: number;
  description?: string | null;
  notes?: string | null;
  status: WorkoutStatus;
  visibility: WorkoutVisibility;
  days: Array<{ name: string; focus?: string | null; exercises: WorkoutExerciseInput[] }>;
};

export type AdminWorkoutPlanSummary = {
  total: number;
  published: number;
  draft: number;
  active: number;
  avgDaysPerWeek: number;
};

function token() {
  const value = getAdminToken();
  if (!value) throw new Error("Not signed in");
  return value;
}

export async function fetchAdminWorkoutPlans(
  query: {
    q?: string;
    status?: WorkoutStatus;
    visibility?: WorkoutVisibility;
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
  const result = await apiRequest<ApiSuccess<{ plans: WorkoutPlan[]; pagination: PaginationMeta }>>(
    `/api/platform-admin/workout-plans?${params}`,
    { token: token() },
  );
  return result.data;
}

export async function fetchAdminWorkoutPlanSummary() {
  const result = await apiRequest<ApiSuccess<{ summary: AdminWorkoutPlanSummary }>>(
    "/api/platform-admin/workout-plans/summary",
    { token: token() },
  );
  return result.data.summary;
}

export async function fetchAdminWorkoutPlan(id: string) {
  const result = await apiRequest<ApiSuccess<{ plan: WorkoutPlan }>>(
    `/api/platform-admin/workout-plans/${id}`,
    { token: token() },
  );
  return result.data.plan;
}

export async function createAdminWorkoutPlan(body: WorkoutPlanInput) {
  const result = await apiRequest<ApiSuccess<{ plan: WorkoutPlan }>>(
    "/api/platform-admin/workout-plans",
    { method: "POST", token: token(), body },
  );
  return result.data.plan;
}

export async function updateAdminWorkoutPlan(id: string, body: Partial<WorkoutPlanInput>) {
  const result = await apiRequest<ApiSuccess<{ plan: WorkoutPlan }>>(
    `/api/platform-admin/workout-plans/${id}`,
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

export async function fetchAdminWorkoutPlanMembers(
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
  >(`/api/platform-admin/workout-plans/${planId}/members?${params}`, { token: token() });
  return result.data;
}
