import { setRequestLocale } from "next-intl/server";

import { StaffManager } from "@/components/staff-manager";

export default async function StaffPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StaffManager />;
}
