import { setRequestLocale } from "next-intl/server";

import { AuthFrame } from "@/components/auth-frame";
import { BusinessPicker } from "@/components/session-screens";

export default async function BusinessesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AuthFrame>
      <BusinessPicker />
    </AuthFrame>
  );
}
