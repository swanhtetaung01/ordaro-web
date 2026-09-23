import { api, errorResponse, publicCall, withAccess, writeTokens } from "@/lib/backend";
import type { Membership, Schemas } from "@/lib/backend";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    phone?: string;
    password?: string;
    fullName?: string;
    businessName?: string;
    signupCode?: string;
  };
  const result = await publicCall<Schemas["IssuedTokens"]>(() =>
    api().POST("/auth/signup", {
      body: {
        phone: body.phone ?? "",
        password: body.password ?? "",
        fullName: body.fullName ?? "",
        businessName: body.businessName ?? "",
        deviceLabel: "ordaro-web",
        signupCode: body.signupCode || undefined,
      },
    }),
  );
  if (!result.ok || !result.data) {
    return errorResponse(result.ok ? 502 : result.status, result.ok ? { code: "unknown" } : result.problem);
  }
  await writeTokens(result.data);
  const listed = await withAccess((token) => api(token).GET("/auth/memberships"));
  const memberships = (listed.response.ok ? listed.data : []) as Membership[];
  return Response.json({ kind: result.data.kind, memberships }, { status: 201 });
}
