import { setRequestLocale } from "next-intl/server";

import { RegisterManager } from "@/components/register-manager";

export default async function RegistersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RegisterManager />;
}
