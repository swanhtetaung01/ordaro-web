/**
 * For uptime monitors and the container health check: the web server answers, and so does the
 * API behind it. No session needed, no data returned.
 */
export async function GET() {
  const base = process.env.TRILLOPOS_API_URL ?? "http://localhost:8080";
  try {
    const response = await fetch(`${base}/actuator/health`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    const backend = response.ok ? "UP" : "DOWN";
    return Response.json({ status: backend === "UP" ? "UP" : "DEGRADED", backend }, { status: response.ok ? 200 : 503 });
  } catch {
    return Response.json({ status: "DEGRADED", backend: "UNREACHABLE" }, { status: 503 });
  }
}
