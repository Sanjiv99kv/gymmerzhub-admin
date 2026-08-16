import { apiRequest, apiFormRequest } from "./api";
import { getAdminToken } from "./admin-auth";
import type { PaginationMeta } from "./admin-gyms";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type FoodDietType = "veg" | "vegan" | "egg" | "non_veg";
export type FoodItemStatus = "active" | "inactive";
export type FoodServingUnit = "g" | "ml" | "piece" | "cup" | "tbsp" | "tsp" | "serving";

export type AdminFoodItem = {
  id: string;
  name: string;
  dietType: FoodDietType;
  servingUnit: FoodServingUnit;
  servingQty: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  allergens: string[];
  notes: string;
  imageUrl: string | null;
  status: FoodItemStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ListAdminFoodItemsQuery = {
  q?: string;
  status?: FoodItemStatus;
  dietType?: FoodDietType;
  page?: number;
  pageSize?: number;
};

export type CreateAdminFoodItem = {
  name: string;
  dietType: FoodDietType;
  servingUnit: FoodServingUnit;
  servingQty: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number | null;
  allergens?: string[];
  notes?: string | null;
  imageUrl?: string | null;
  status: FoodItemStatus;
};

export type UpdateAdminFoodItem = Partial<CreateAdminFoodItem>;

export type AdminFoodItemSummary = {
  total: number;
  active: number;
  inactive: number;
  avgCalories: number;
};

function tokenOrThrow() {
  const token = getAdminToken();
  if (!token) throw new Error("Not signed in");
  return token;
}

export async function fetchAdminFoodItems(query: ListAdminFoodItemsQuery = {}) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.dietType) params.set("dietType", query.dietType);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));

  const result = await apiRequest<
    ApiSuccess<{ items: AdminFoodItem[]; pagination: PaginationMeta }>
  >(`/api/platform-admin/food-items?${params}`, {
    method: "GET",
    token: tokenOrThrow(),
  });
  return result.data;
}

export async function fetchAdminFoodItemSummary() {
  const result = await apiRequest<ApiSuccess<{ summary: AdminFoodItemSummary }>>(
    "/api/platform-admin/food-items/summary",
    { method: "GET", token: tokenOrThrow() },
  );
  return result.data.summary;
}

export async function createAdminFoodItem(body: CreateAdminFoodItem) {
  const result = await apiRequest<ApiSuccess<{ item: AdminFoodItem }>>(
    "/api/platform-admin/food-items",
    { method: "POST", token: tokenOrThrow(), body },
  );
  return result.data.item;
}

export async function updateAdminFoodItem(foodItemId: string, body: UpdateAdminFoodItem) {
  const result = await apiRequest<ApiSuccess<{ item: AdminFoodItem }>>(
    `/api/platform-admin/food-items/${foodItemId}`,
    { method: "PATCH", token: tokenOrThrow(), body },
  );
  return result.data.item;
}

export async function uploadAdminFoodImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const result = await apiFormRequest<ApiSuccess<{ media: { url: string; publicId: string } }>>(
    "/api/platform-admin/food-items/media",
    { formData, token: tokenOrThrow() },
  );
  return result.data.media;
}
