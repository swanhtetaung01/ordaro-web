import { setRequestLocale } from "next-intl/server";

import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SettingsForm />;
}
