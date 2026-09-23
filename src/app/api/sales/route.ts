import { proxy } from "@/lib/backend";

/** The sales log and the held-cart list: status, locationId, customerId, from, to, limit. */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.toString();
  return proxy(`/sales${query ? `?${query}` : ""}`);
}

export async function POST(request: Request) {
  return proxy("/sales", { method: "POST", body: await request.json() });
}
