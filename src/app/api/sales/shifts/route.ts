import { proxy } from "@/lib/backend";

export async function GET(request: Request) {
  const locationId = new URL(request.url).searchParams.get("locationId");
  return proxy(`/shifts/current?locationId=${locationId ?? ""}`);
}

export async function POST(request: Request) {
  return proxy("/shifts", { method: "POST", body: await request.json() });
}
