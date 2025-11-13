import { API_BASE } from "../config";

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const text = await response.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.message === "string") {
        message = parsed.message;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message || response.statusText);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json() as Promise<T>;
}

function buildHeaders(extra?: HeadersInit) {
  const headers: HeadersInit = {
    ...(extra ?? {})
  };
  if (authToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: buildHeaders()
  });
  return handleResponse<T>(response);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: { method?: "POST" | "PUT" | "PATCH" | "DELETE" }
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options?.method ?? "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body)
  });
  return handleResponse<T>(response);
}

