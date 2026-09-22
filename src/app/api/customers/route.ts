import { proxy } from "@/lib/backend";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.toString();
  return proxy(`/customers${query ? `?${query}` : ""}`);
}

export async function POST(request: Request) {
  return proxy("/customers", { method: "POST", body: await request.json() });
}
