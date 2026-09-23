import { errorResponse, proxy } from "@/lib/backend";

const reports = new Set(["summary", "sales-by-day", "top-products", "low-stock", "payment-mix"]);

/** The dashboard's numbers: one route for the five report endpoints, nothing else passes. */
export async function GET(request: Request, context: { params: Promise<{ report: string }> }) {
  const { report } = await context.params;
  if (!reports.has(report)) {
    return errorResponse(404, { code: "not_found" });
  }
  const query = new URL(request.url).searchParams.toString();
  return proxy(`/reports/${report}${query ? `?${query}` : ""}`);
}
