const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
).replace(/\/$/, "");

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "super_admin";
};

type AdminResponse = {
  success: boolean;
  admin?: AdminUser;
  message?: string;
};

export async function adminLogin(
  email: string,
  password: string
): Promise<AdminUser> {
  const res = await fetch(`${API}/admin/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = (await res.json()) as AdminResponse;

  if (!res.ok || !data.admin) {
    throw new Error(data.message || "Unable to sign in");
  }

  return data.admin;
}

export async function adminMe(): Promise<AdminUser> {
  const res = await fetch(`${API}/admin/me`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Unauthorized");

  const data = (await res.json()) as AdminResponse;

  if (!data.admin) throw new Error("Session unavailable");

  return data.admin;
}

export async function adminLogout(): Promise<void> {
  const res = await fetch(`${API}/admin/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Sign out failed");
}
