import { apiRequest, formatApiError } from "./api";

const STORAGE_KEY = "gymmerz.ops.session";

export type PlatformAdmin = {
  id: string;
  email: string;
  fullName: string;
  status: string;
  lastLoginAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminSession = {
  token: string;
  admin: PlatformAdmin;
};

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

type PlatformAdminAuthData = {
  token: string;
  admin: PlatformAdmin;
};

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.token || !parsed?.admin?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAdminToken(): string | null {
  return getAdminSession()?.token ?? null;
}

export async function loginAdmin(email: string, password: string): Promise<AdminSession> {
  const result = await apiRequest<ApiSuccess<PlatformAdminAuthData>>(
    "/api/platform-admin/auth/login",
    {
      method: "POST",
      body: { email, password },
    },
  );

  return {
    token: result.data.token,
    admin: result.data.admin,
  };
}

export async function logoutAdmin(): Promise<void> {
  const session = getAdminSession();
  if (!session?.token) {
    clearAdminSession();
    return;
  }

  try {
    await apiRequest("/api/platform-admin/auth/logout", {
      method: "POST",
      token: session.token,
    });
  } catch (error) {
    // Still clear local session if the token is already invalid/expired.
    if (!(error instanceof Error && "status" in error && (error as { status: number }).status === 401)) {
      throw new Error(formatApiError(error, "Could not sign out"));
    }
  } finally {
    clearAdminSession();
  }
}

export async function fetchAdminMe(): Promise<PlatformAdmin> {
  const token = getAdminToken();
  if (!token) throw new Error("Not signed in");

  const result = await apiRequest<ApiSuccess<{ admin: PlatformAdmin }>>(
    "/api/platform-admin/auth/me",
    { token },
  );

  const session = getAdminSession();
  if (session) {
    setAdminSession({ ...session, admin: result.data.admin });
  }

  return result.data.admin;
}

export async function updateAdminProfile(fullName: string): Promise<PlatformAdmin> {
  const token = getAdminToken();
  if (!token) throw new Error("Not signed in");

  const result = await apiRequest<ApiSuccess<{ admin: PlatformAdmin }>>(
    "/api/platform-admin/auth/me",
    {
      method: "PATCH",
      token,
      body: { fullName },
    },
  );

  const session = getAdminSession();
  if (session) {
    setAdminSession({ ...session, admin: result.data.admin });
  }

  return result.data.admin;
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error("Not signed in");

  await apiRequest("/api/platform-admin/auth/change-password", {
    method: "POST",
    token,
    body: { currentPassword, newPassword },
  });
}

export type PlatformAdminDeviceSession = {
  id: string;
  ipAddress: string | null;
  deviceLabel: string;
  userAgent: string | null;
  lastActiveAt: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
};

export async function fetchAdminSessions(): Promise<PlatformAdminDeviceSession[]> {
  const token = getAdminToken();
  if (!token) throw new Error("Not signed in");

  const result = await apiRequest<ApiSuccess<{ sessions: PlatformAdminDeviceSession[] }>>(
    "/api/platform-admin/auth/sessions",
    { token },
  );

  return result.data.sessions;
}

export async function revokeAdminSession(sessionId: string): Promise<{ revoked: boolean; current: boolean }> {
  const token = getAdminToken();
  if (!token) throw new Error("Not signed in");

  const result = await apiRequest<ApiSuccess<{ revoked: boolean; current: boolean }>>(
    `/api/platform-admin/auth/sessions/${sessionId}`,
    {
      method: "DELETE",
      token,
    },
  );

  return result.data;
}
