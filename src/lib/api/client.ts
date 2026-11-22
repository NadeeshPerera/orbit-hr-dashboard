import { useAuthStore } from "@/features/auth/auth-store";

/** RFC 7807 problem details from the API. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly title: string,
    public readonly detail?: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(detail ?? title);
    this.name = "ApiError";
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

type Params = Record<string, string | number | undefined | null>;

/**
 * Thin fetch wrapper: base URL, bearer token, JSON, typed errors.
 * Set NEXT_PUBLIC_API_URL to talk to a real backend; by default requests go to
 * same-origin /api/*, which Mock Service Worker answers in the browser.
 */
export async function api<T>(path: string, { params, ...init }: RequestInit & { params?: Params } = {}): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  }
  const url = `${base}${path}${search.size ? `?${search}` : ""}`;
  const token = useAuthStore.getState().token;

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.title ?? res.statusText, body.detail, body.errors);
  }
  return res.json() as Promise<T>;
}
