import createClient from "openapi-fetch";
import { cookies } from "next/headers";

import type { components, paths } from "./api/schema";

export type Schemas = components["schemas"];
export type Tokens = Schemas["IssuedTokens"];
export type Membership = Schemas["PickerEntry"];

const ACCESS = "ordaro_access";
const REFRESH = "ordaro_refresh";

export type Problem = {
  code?: string;
  title?: string;
  detail?: string;
};

function apiBase() {
  return process.env.ORDARO_API_URL ?? "http://localhost:8080";
}

/**
 * Node's fetch rejects a 401 answer to a Request whose body is a stream ("expected non-null
 * body source"), which is how openapi-fetch sends it. Re-send with the body as a string.
 */
async function bufferedFetch(input: Request) {
  const body = input.method === "GET" || input.method === "HEAD" ? undefined : await input.text();
  return fetch(input.url, { method: input.method, headers: input.headers, body, signal: input.signal });
}

function client(token?: string) {
  return createClient<paths>({
    baseUrl: apiBase(),
    fetch: bufferedFetch,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function maxAge(iso: string | undefined, fallback: number) {
  if (!iso) {
    return fallback;
  }
  const seconds = Math.floor((Date.parse(iso) - Date.now()) / 1000);
  return seconds > 0 ? seconds : fallback;
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function writeTokens(tokens: Tokens) {
  if (!tokens.accessToken || !tokens.refreshToken) {
    throw new Error("backend omitted tokens");
  }
  const jar = await cookies();
  jar.set(ACCESS, tokens.accessToken, cookieOptions(maxAge(tokens.accessTokenExpiresAt, 15 * 60)));
  jar.set(
    REFRESH,
    tokens.refreshToken,
    cookieOptions(maxAge(tokens.refreshTokenExpiresAt, 30 * 24 * 60 * 60)),
  );
}

export async function clearTokens() {
  const jar = await cookies();
  jar.delete(ACCESS);
  jar.delete(REFRESH);
}

export async function hasSessionCookie() {
  const jar = await cookies();
  return jar.has(ACCESS) || jar.has(REFRESH);
}

export function tokenKind(accessToken: string | undefined) {
  if (!accessToken) {
    return undefined;
  }
  const payload = accessToken.split(".")[1];
  if (!payload) {
    return undefined;
  }
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { kind?: string };
    return claims.kind;
  } catch {
    return undefined;
  }
}

function problemOf(error: unknown, status: number): Problem {
  if (error && typeof error === "object") {
    const body = error as Problem;
    return { code: body.code ?? body.title, detail: body.detail };
  }
  return { code: status === 401 ? "invalid_credentials" : "unknown" };
}

async function refreshAccess() {
  const refreshToken = (await cookies()).get(REFRESH)?.value;
  if (!refreshToken) {
    return undefined;
  }
  const result = await client().POST("/auth/refresh", { body: { refreshToken } });
  if (!result.response.ok || !result.data?.accessToken) {
    await clearTokens();
    return undefined;
  }
  await writeTokens(result.data);
  return result.data.accessToken;
}

export async function accessToken() {
  return (await cookies()).get(ACCESS)?.value;
}

export async function refreshToken() {
  return (await cookies()).get(REFRESH)?.value;
}

/** Calls the backend. On 401, rotates the refresh cookie once and retries.
 * Server Components must pass `{ refresh: false }`: cookie writes are only legal in a route handler. */
export async function withAccess<T>(
  run: (token: string | undefined) => Promise<{ data?: T; error?: unknown; response: Response }>,
  options?: { refresh?: boolean },
) {
  const first = await run(await accessToken());
  if (first.response.status !== 401 || options?.refresh === false) {
    return first;
  }
  const renewed = await refreshAccess();
  if (!renewed) {
    return first;
  }
  return run(renewed);
}

export async function publicCall<T>(
  run: () => Promise<{ data?: T; error?: unknown; response: Response }>,
) {
  const result = await run();
  if (!result.response.ok) {
    return { ok: false as const, status: result.response.status, problem: problemOf(result.error, result.response.status) };
  }
  return { ok: true as const, status: result.response.status, data: result.data as T };
}

export function api(token?: string) {
  return client(token);
}

export function errorResponse(status: number, problem: Problem) {
  return Response.json({ code: problem.code ?? "unknown" }, { status });
}

/** Forwards one backend call. The browser still never sees the bearer token. */
export async function proxy(path: string, init?: { method?: string; body?: unknown }) {
  const result = await withAccess(async (token) => {
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const hasBody = init?.body !== undefined;
    if (hasBody) {
      headers.set("Content-Type", "application/json");
    }
    const response = await fetch(`${apiBase()}${path}`, {
      method: init?.method ?? "GET",
      headers,
      body: hasBody ? JSON.stringify(init.body) : undefined,
    });
    const text = await response.text();
    let data: unknown;
    let error: unknown;
    if (text) {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (response.ok) {
          data = parsed;
        } else {
          error = parsed;
        }
      } catch {
        error = { code: "unknown", detail: text };
      }
    }
    return { data, error, response };
  });
  if (!result.response.ok) {
    const body = result.error as Problem | undefined;
    return errorResponse(result.response.status || 502, { code: body?.code ?? body?.title ?? "unknown" });
  }
  if (result.response.status === 204) {
    return new Response(null, { status: 204 });
  }
  return Response.json(result.data ?? null, { status: result.response.status });
}
