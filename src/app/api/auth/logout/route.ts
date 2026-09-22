import { accessToken, api, clearTokens, refreshToken } from "@/lib/backend";

export async function POST() {
  const refresh = await refreshToken();
  if (refresh) {
    await api(await accessToken()).POST("/auth/logout", { body: { refreshToken: refresh } });
  }
  await clearTokens();
  return new Response(null, { status: 204 });
}
