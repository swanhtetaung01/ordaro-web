import { setRequestLocale } from "next-intl/server";

import { AccountForm } from "@/components/account-form";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AccountForm />;
}
