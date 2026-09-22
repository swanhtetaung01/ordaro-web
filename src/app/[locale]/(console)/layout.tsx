import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { redirect } from "@/i18n/navigation";

import { Shell } from "@/components/ui";
import { api, tokenKind, withAccess } from "@/lib/backend";
import type { Membership, Schemas } from "@/lib/backend";

export default async function ConsoleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await withAccess((token) => api(token).GET("/auth/memberships"), { refresh: false });
  if (!session.response.ok) {
    nextRedirect(`/api/auth/resume?locale=${locale}`);
  }
  const kind = tokenKind(await import("@/lib/backend").then((mod) => mod.accessToken()));
  if (kind === "PICKER") {
    redirect({ href: "/businesses", locale });
  }
  const organization = await withAccess((token) => api(token).GET("/organization"), { refresh: false });
  const memberships = (session.data ?? []) as Membership[];
  const org = organization.data as Schemas["OrganizationView"] | undefined;
  const current = memberships.find((row) => row.organizationId === org?.id && row.status === "ACTIVE");
  const shell = await getTranslations({ locale, namespace: "shell" });
  return (
    <Shell organizationName={org?.name ?? shell("unknownOrg")} userName={current?.displayName ?? shell("you")}>
      {children}
    </Shell>
  );
}
