export async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (response.status === 401) {
    throw new Error("unauthorized");
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { code?: string };
    throw new Error(body.code ?? "unknown");
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
