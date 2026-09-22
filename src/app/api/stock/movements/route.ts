import { proxy } from "@/lib/backend";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const locationId = query.get("locationId");
  const productId = query.get("productId");
  if (!locationId || !productId) {
    return Response.json({ code: "validation_failed" }, { status: 400 });
  }
  return proxy(`/stock-movements?locationId=${locationId}&productId=${productId}`);
}
