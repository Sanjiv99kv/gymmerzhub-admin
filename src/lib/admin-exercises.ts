import { apiRequest, apiFormRequest } from "./api";
import { getAdminToken } from "./admin-auth";
import type { PaginationMeta } from "./admin-gyms";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ExerciseLevel = "beginner" | "intermediate" | "advanced";
export type ExerciseStatus = "active" | "inactive";
export type ExerciseEquipment =
  | "barbell"
  | "dumbbell"
  | "kettlebell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "band"
  | "smith_machine"
  | "other";

export type AdminExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: ExerciseEquipment | "";
  level: ExerciseLevel | null;
  instructions: string;
  imageUrl: string | null;
  videoUrl: string | null;
  imageUrls: string[];
  videoUrls: string[];
  notes: string;
  status: ExerciseStatus;
  createdByAdminId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ListAdminExercisesQuery = {
  q?: string;
  status?: ExerciseStatus;
  muscleGroup?: string;
  equipment?: ExerciseEquipment;
  level?: ExerciseLevel;
  page?: number;
  pageSize?: number;
};

export type CreateAdminExercise = {
  name: string;
  muscleGroup?: string | null;
  equipment?: ExerciseEquipment | null;
  level?: ExerciseLevel | null;
  instructions?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  imageUrls?: string[];
  videoUrls?: string[];
  notes?: string | null;
  status: ExerciseStatus;
};

export type UpdateAdminExercise = Partial<CreateAdminExercise>;

export type AdminExerciseSummary = {
  total: number;
  active: number;
  inactive: number;
  withVideo: number;
};

export const EXERCISE_LEVELS: ExerciseLevel[] = ["beginner", "intermediate", "advanced"];

export const EXERCISE_LEVEL_LABELS: Record<ExerciseLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const EXERCISE_EQUIPMENT: ExerciseEquipment[] = [
  "barbell",
  "dumbbell",
  "kettlebell",
  "cable",
  "machine",
  "bodyweight",
  "band",
  "smith_machine",
  "other",
];

export const EXERCISE_EQUIPMENT_LABELS: Record<ExerciseEquipment, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  kettlebell: "Kettlebell",
  cable: "Cable",
  machine: "Machine",
  bodyweight: "Bodyweight",
  band: "Band",
  smith_machine: "Smith machine",
  other: "Other",
};

export function exerciseEquipmentLabel(value: string | null | undefined) {
  if (!value) return "—";
  return EXERCISE_EQUIPMENT_LABELS[value as ExerciseEquipment] ?? value;
}

function tokenOrThrow() {
  const token = getAdminToken();
  if (!token) throw new Error("Not signed in");
  return token;
}

export async function fetchAdminExercises(query: ListAdminExercisesQuery = {}) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.muscleGroup) params.set("muscleGroup", query.muscleGroup);
  if (query.equipment) params.set("equipment", query.equipment);
  if (query.level) params.set("level", query.level);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));

  const result = await apiRequest<
    ApiSuccess<{ items: AdminExercise[]; pagination: PaginationMeta }>
  >(`/api/platform-admin/exercises?${params}`, {
    method: "GET",
    token: tokenOrThrow(),
  });
  return result.data;
}

export async function fetchAdminExerciseSummary() {
  const result = await apiRequest<ApiSuccess<{ summary: AdminExerciseSummary }>>(
    "/api/platform-admin/exercises/summary",
    { method: "GET", token: tokenOrThrow() },
  );
  return result.data.summary;
}

export async function createAdminExercise(body: CreateAdminExercise) {
  const result = await apiRequest<ApiSuccess<{ item: AdminExercise }>>(
    "/api/platform-admin/exercises",
    { method: "POST", token: tokenOrThrow(), body },
  );
  return result.data.item;
}

export async function updateAdminExercise(exerciseId: string, body: UpdateAdminExercise) {
  const result = await apiRequest<ApiSuccess<{ item: AdminExercise }>>(
    `/api/platform-admin/exercises/${exerciseId}`,
    { method: "PATCH", token: tokenOrThrow(), body },
  );
  return result.data.item;
}

export type UploadedExerciseMedia = {
  url: string;
  kind: "image" | "video";
  publicId: string;
  format: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
};

export async function uploadAdminExerciseMedia(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const result = await apiFormRequest<ApiSuccess<{ media: UploadedExerciseMedia }>>(
    "/api/platform-admin/exercises/media",
    { formData, token: tokenOrThrow() },
  );
  return result.data.media;
}
