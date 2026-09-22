import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

export default async function IndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const jar = await cookies();
  redirect({ href: jar.has("ordaro_access") || jar.has("ordaro_refresh") ? "/home" : "/login", locale });
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "brand" });
  return { title: t("name") };
}
