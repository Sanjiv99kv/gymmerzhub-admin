export type ApiErrorBody = {
  success?: false;
  message?: string;
  error?: string;
  errors?: Array<{ field?: string; message?: string }>;
};

export class ApiError extends Error {
  status: number;
  errors: Array<{ field?: string; message?: string }>;

  constructor(status: number, message: string, errors: ApiErrorBody["errors"] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors ?? [];
  }
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8800";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  let payload: (T & ApiErrorBody) | ApiErrorBody | null = null;
  try {
    payload = (await response.json()) as T & ApiErrorBody;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload && "message" in payload && payload.message) ||
      `Request failed (${response.status})`;
    const errors = payload && "errors" in payload ? payload.errors : [];
    throw new ApiError(response.status, message, errors);
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    method: rest.method || "GET",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseJsonResponse<T>(response);
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function formatApiError(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ApiError) {
    if (error.errors?.length) {
      return error.errors.map((e) => e.message).filter(Boolean).join(". ") || error.message;
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}
